#!/usr/bin/env python3
"""
Advanced AI Services for Problem Reporter
- Duplicate Detection: Computer vision for similar issues within 1km radius
- Completion Verification: Before/after photo comparison
- Fake Report Detection: Identify suspicious or invalid reports
"""

import os
import cv2
import numpy as np
from PIL import Image
import math
from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
import json


class DuplicateDetector:
    """Detect duplicate issues using computer vision and location clustering"""

    def __init__(self):
        self.similarity_threshold = 0.7  # Minimum similarity for duplicates
        self.max_distance_km = 1.0  # Maximum distance for clustering

    def calculate_image_similarity(self, image_path1: str, image_path2: str) -> float:
        """Calculate similarity between two images using feature matching"""
        try:
            # Load images
            img1 = cv2.imread(image_path1)
            img2 = cv2.imread(image_path2)

            if img1 is None or img2 is None:
                return 0.0

            # Convert to grayscale
            gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

            # Initialize ORB detector
            orb = cv2.ORB_create()

            # Find keypoints and descriptors
            kp1, des1 = orb.detectAndCompute(gray1, None)
            kp2, des2 = orb.detectAndCompute(gray2, None)

            if des1 is None or des2 is None or len(des1) == 0 or len(des2) == 0:
                return 0.0

            # Create BFMatcher
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

            # Match descriptors
            matches = bf.match(des1, des2)

            # Sort matches by distance
            matches = sorted(matches, key=lambda x: x.distance)

            # Calculate similarity score
            if len(matches) > 10:
                # Use top 50% of matches
                good_matches = matches[:len(matches)//2]
                similarity = len(good_matches) / max(len(kp1), len(kp2))
                return min(similarity, 1.0)

            return 0.0

        except Exception as e:
            print(f"Error calculating image similarity: {e}")
            return 0.0

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in kilometers"""
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        return R * c

    def find_duplicates(self, new_issue: Dict, existing_issues: List[Dict]) -> List[Dict]:
        """Find duplicate issues for a new issue"""
        duplicates = []

        for existing in existing_issues:
            # Check if within time window (last 30 days)
            if existing['created_at'] < datetime.utcnow() - timedelta(days=30):
                continue

            # Check distance
            distance = self.calculate_distance(
                new_issue['latitude'], new_issue['longitude'],
                existing['latitude'], existing['longitude']
            )

            if distance > self.max_distance_km:
                continue

            # Check image similarity if both have images
            similarity = 0.0
            if new_issue.get('image_path') and existing.get('image_path'):
                try:
                    similarity = self.calculate_image_similarity(
                        new_issue['image_path'],
                        existing['image_path']
                    )
                except:
                    similarity = 0.0

            # Check if same issue type and high similarity or close proximity
            if (new_issue['issue_type'] == existing['issue_type'] and
                (similarity >= self.similarity_threshold or distance < 0.2)):  # 200m
                duplicates.append({
                    'issue': existing,
                    'similarity': similarity,
                    'distance': distance
                })

        return duplicates


class CompletionVerifier:
    """Verify completion by comparing before/after photos"""

    def __init__(self):
        self.completion_threshold = 0.8  # Minimum confidence for completion

    def verify_completion(self, original_image_path: str, completion_image_path: str) -> Tuple[bool, float, str]:
        """
        Compare original issue photo with completion photo
        Returns: (is_complete, confidence, notes)
        """
        try:
            # Load images
            orig_img = cv2.imread(original_image_path)
            comp_img = cv2.imread(completion_image_path)

            if orig_img is None or comp_img is None:
                return False, 0.0, "Could not load images"

            # Convert to grayscale
            orig_gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY)
            comp_gray = cv2.cvtColor(comp_img, cv2.COLOR_BGR2GRAY)

            # Calculate structural similarity
            ssim_score = self._calculate_ssim(orig_gray, comp_gray)

            # Calculate color histogram difference
            hist_diff = self._calculate_histogram_difference(orig_img, comp_img)

            # Combine scores (lower SSIM + higher hist diff = more change = better completion)
            confidence = (1 - ssim_score) * 0.6 + hist_diff * 0.4

            is_complete = confidence >= self.completion_threshold

            notes = f"SSIM: {ssim_score:.2f}, Hist Diff: {hist_diff:.2f}, Confidence: {confidence:.2f}"

            return is_complete, confidence, notes

        except Exception as e:
            return False, 0.0, f"Error during verification: {str(e)}"

    def _calculate_ssim(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """Calculate Structural Similarity Index"""
        # Simple implementation - in production use skimage.metrics
        try:
            # Resize images to same size
            h, w = min(img1.shape[0], img2.shape[0]), min(img1.shape[1], img2.shape[1])
            img1_resized = cv2.resize(img1, (w, h))
            img2_resized = cv2.resize(img2, (w, h))

            # Calculate mean
            mu1 = np.mean(img1_resized)
            mu2 = np.mean(img2_resized)

            # Calculate variance and covariance
            sigma1_sq = np.var(img1_resized)
            sigma2_sq = np.var(img2_resized)
            sigma12 = np.cov(img1_resized.flatten(), img2_resized.flatten())[0, 1]

            # SSIM formula
            c1 = (0.01 * 255) ** 2
            c2 = (0.03 * 255) ** 2

            numerator = (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2)
            denominator = (mu1**2 + mu2**2 + c1) * (sigma1_sq + sigma2_sq + c2)

            return numerator / denominator if denominator != 0 else 0.0

        except:
            return 0.0

    def _calculate_histogram_difference(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """Calculate histogram difference between images"""
        try:
            # Calculate histograms
            hist1 = cv2.calcHist([img1], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
            hist2 = cv2.calcHist([img2], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])

            # Normalize
            hist1 = cv2.normalize(hist1, hist1).flatten()
            hist2 = cv2.normalize(hist2, hist2).flatten()

            # Calculate correlation
            correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

            # Convert to difference score (1 - correlation)
            return 1 - correlation

        except:
            return 0.0


class FakeReportDetector:
    """Detect potentially fake or suspicious reports"""

    def __init__(self):
        self.suspicious_patterns = {
            'same_location_reports': 5,  # Max reports from same location per day
            'rapid_reports': 10,  # Max reports per hour
            'similar_images': 0.95,  # Very high similarity threshold
            'generic_descriptions': ['test', 'fake', 'spam', 'dummy']
        }

    def analyze_report(self, report_data: Dict, user_history: List[Dict]) -> Tuple[bool, float, str]:
        """
        Analyze a report for suspicious patterns
        Returns: (is_suspicious, risk_score, reason)
        """
        risk_score = 0.0
        reasons = []

        # Check for generic/spammy descriptions
        description = report_data.get('description', '').lower()
        for spam_word in self.suspicious_patterns['generic_descriptions']:
            if spam_word in description:
                risk_score += 0.3
                reasons.append(f"Contains spam word: {spam_word}")

        # Check user's reporting frequency
        recent_reports = [r for r in user_history if r['created_at'] > datetime.utcnow() - timedelta(hours=1)]
        if len(recent_reports) >= self.suspicious_patterns['rapid_reports']:
            risk_score += 0.4
            reasons.append(f"Too many reports in last hour: {len(recent_reports)}")

        # Check location clustering
        same_location_reports = [r for r in user_history
                               if self._same_location(r, report_data, radius_km=0.1)]
        if len(same_location_reports) >= self.suspicious_patterns['same_location_reports']:
            risk_score += 0.3
            reasons.append(f"Multiple reports from same location: {len(same_location_reports)}")

        # Check image similarity with user's previous reports
        if report_data.get('image_path'):
            for prev_report in user_history[-10:]:  # Check last 10 reports
                if prev_report.get('image_path'):
                    try:
                        similarity = self._calculate_image_similarity(
                            report_data['image_path'],
                            prev_report['image_path']
                        )
                        if similarity >= self.suspicious_patterns['similar_images']:
                            risk_score += 0.5
                            reasons.append(f"Very similar to previous report (similarity: {similarity:.2f})")
                            break
                    except:
                        pass

        is_suspicious = risk_score >= 0.5
        reason = "; ".join(reasons) if reasons else "Clean report"

        return is_suspicious, risk_score, reason

    def _same_location(self, report1: Dict, report2: Dict, radius_km: float) -> bool:
        """Check if two reports are from the same location"""
        try:
            distance = DuplicateDetector().calculate_distance(
                report1['latitude'], report1['longitude'],
                report2['latitude'], report2['longitude']
            )
            return distance <= radius_km
        except:
            return False

    def _calculate_image_similarity(self, path1: str, path2: str) -> float:
        """Simple image similarity check"""
        return DuplicateDetector().calculate_image_similarity(path1, path2)


class GamificationEngine:
    """Handle user reputation and civic points"""

    def __init__(self):
        self.points_config = {
            'valid_report': 10,
            'duplicate_report': 5,
            'fake_report': -20,
            'upvote_received': 2,
            'verification_bonus': 15,
            'streak_bonus': 5,  # Per consecutive valid report
        }

        self.badges = {
            'first_report': {'name': 'First Reporter', 'points': 10, 'icon': '🎯'},
            'community_helper': {'name': 'Community Helper', 'points': 50, 'icon': '🤝'},
            'problem_solver': {'name': 'Problem Solver', 'points': 100, 'icon': '🔧'},
            'trusted_reporter': {'name': 'Trusted Reporter', 'points': 200, 'icon': '⭐'},
            'civic_champion': {'name': 'Civic Champion', 'points': 500, 'icon': '🏆'},
        }

    def award_points(self, user: Dict, action: str, multiplier: float = 1.0) -> int:
        """Award points for user actions"""
        base_points = self.points_config.get(action, 0)
        points = int(base_points * multiplier)

        # Streak bonus for consecutive valid reports
        if action == 'valid_report':
            streak = self._calculate_streak(user)
            if streak > 1:
                points += self.points_config['streak_bonus'] * (streak - 1)

        return points

    def check_badges(self, user: Dict) -> List[str]:
        """Check if user qualifies for new badges"""
        new_badges = []

        if user['total_reports'] >= 1 and 'first_report' not in user.get('badges', []):
            new_badges.append('first_report')

        if user['valid_reports'] >= 10 and 'community_helper' not in user.get('badges', []):
            new_badges.append('community_helper')

        if user['valid_reports'] >= 25 and 'problem_solver' not in user.get('badges', []):
            new_badges.append('problem_solver')

        if user['reputation_score'] >= 0.9 and 'trusted_reporter' not in user.get('badges', []):
            new_badges.append('trusted_reporter')

        if user['civic_points'] >= 1000 and 'civic_champion' not in user.get('badges', []):
            new_badges.append('civic_champion')

        return new_badges

    def _calculate_streak(self, user: Dict) -> int:
        """Calculate current valid report streak"""
        # This would need access to user's report history
        # For now, return a simple calculation
        return min(user.get('valid_reports', 0), 10)