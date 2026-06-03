from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional

from ..database import get_db
from ..models import Issue, User, IssueUpdate, IssueUpvote
from ..schemas import (
    IssueList, IssueDetailResponse, Issue as IssueSchema, IssueCreate, IssueUpdate as IssueUpdateSchema
)
from ..services import AIIssueDetector, PriorityScorer
from ..services.auth import decode_access_token
from ..services.geocoding import GeocodingService
from ..services.advanced_ai import DuplicateDetector, FakeReportDetector, GamificationEngine
import uuid

router = APIRouter(prefix="/api/issues", tags=["issues"])

# Request models for duplicate management
class ConfirmDuplicatesRequest(BaseModel):
    duplicate_group_id: str
    issue_ids_to_delete: List[int]

# Initialize AI detector (lazy initialization)
detector = None

def get_detector():
    global detector
    if detector is None:
        try:
            from ..services import AIIssueDetector
            detector = AIIssueDetector()
        except Exception as e:
            print(f"Warning: Could not initialize AI detector: {e}")
            detector = None
    return detector


@router.post("/upload")
async def upload_issue(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(default=""),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_description: str = Form(default=""),
    issue_type: str = Form(default="other"),  # User can manually select
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload a new issue with image
    - Runs AI detection on image
    - Calculates priority score
    - Stores in database
    """
    try:
        # Decode token to get user
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        reporter_id = int(payload.get("sub"))

        # Create uploads directory if not exists
        os.makedirs("uploads", exist_ok=True)
        
        # Save uploaded file
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Store as URL path for frontend access
        url_path = f"/uploads/{file.filename}"
        
        # Use user-provided issue type, or try AI detection if "auto" selected
        confidence = 0.0
        detected_objects = []
        priority_type_for_scoring = issue_type  # May differ from stored issue_type
        
        if issue_type == "auto":
            # Try AI detection for auto-detect
            detector = get_detector()
            if detector:
                detected_issue_type, confidence, detected_objects = detector.detect_issue_type(file_path)
                if confidence > 0.3:
                    # AI found something - use it
                    issue_type = detected_issue_type
                    priority_type_for_scoring = detected_issue_type
                print(f"[AI] Detected: {issue_type} (confidence: {confidence:.2f})")
            else:
                # AI has low confidence - keep "other" but report actual AI confidence
                issue_type = "other"
                priority_type_for_scoring = "other"
                confidence = max(confidence, 0.3)
                print(f"[AI] Confidence {confidence:.2f}, using 'other' type")
        elif issue_type != "other":
            # User selected a specific type - use that with high confidence
            confidence = 0.95
            priority_type_for_scoring = issue_type
            print(f"[USER] Selected: {issue_type}")
        else:
            # User selected "other" - try AI but keep as "other" if fails
            detector = get_detector()
            if detector:
                detected_issue_type, detected_conf, detected_objects = detector.detect_issue_type(file_path)
                if detected_conf > 0.7:
                    # AI found something with HIGH confidence - use detected type for BOTH storage and priority
                    issue_type = detected_issue_type
                priority_type_for_scoring = detected_issue_type
                confidence = detected_conf
                print(f"[AI] High confidence: {issue_type} ({confidence:.2%})")
            elif detected_conf > 0.5:
                # AI found something with medium confidence - use detected type for priority only
                priority_type_for_scoring = detected_issue_type
                confidence = detected_conf
                print(f"[AI] Detected: {issue_type} (confidence: {confidence:.2f}, using for priority)")
            else:
                # Keep as "other" 
                priority_type_for_scoring = "other"
                confidence = max(detected_conf, 0.3)
                detected_objects = []
                print(f"[AI] Low confidence {confidence:.2f}, using 'other' type")
        
        # Calculate priority score using the appropriate issue type
        priority_score, priority_level = PriorityScorer.calculate_priority_score(
            issue_type=priority_type_for_scoring,
            ai_confidence=confidence,
            upvotes=0,
            status="reported"
        )
        
        # DUPLICATE DETECTION
        duplicate_detector = DuplicateDetector()
        fake_detector = FakeReportDetector()
        gamification = GamificationEngine()
        
        # Get existing issues for duplicate detection
        existing_issues = db.query(Issue).filter(
            Issue.created_at > datetime.utcnow() - timedelta(days=30)
        ).all()
        
        existing_issues_data = [{
            'id': i.id,
            'latitude': i.latitude,
            'longitude': i.longitude,
            'issue_type': i.issue_type,
            'image_path': i.image_path.replace('/uploads/', 'uploads/') if i.image_path else None,  # Convert URL path to file path
            'created_at': i.created_at
        } for i in existing_issues]
        
        new_issue_data = {
            'latitude': latitude,
            'longitude': longitude,
            'issue_type': issue_type,
            'image_path': file_path,
            'created_at': datetime.utcnow()
        }
        
        # Check for duplicates
        duplicates = duplicate_detector.find_duplicates(new_issue_data, existing_issues_data)
        
        # FAKE REPORT DETECTION
        user = db.query(User).filter(User.id == reporter_id).first()
        user_history = [{
            'latitude': i.latitude,
            'longitude': i.longitude,
            'description': i.description,
            'image_path': i.image_path,
            'created_at': i.created_at
        } for i in user.issues[-20:]] if user else []  # Last 20 reports
        
        report_data = {
            'description': description,
            'latitude': latitude,
            'longitude': longitude,
            'image_path': file_path
        }
        
        is_fake, risk_score, fake_reason = fake_detector.analyze_report(report_data, user_history)
        
        # Handle duplicates
        duplicate_group_id = None
        is_duplicate = False
        duplicate_count = 1
        
        if duplicates:
            # Merge with most similar duplicate
            best_duplicate = max(duplicates, key=lambda x: x['similarity'])
            duplicate_issue = db.query(Issue).filter(Issue.id == best_duplicate['issue']['id']).first()
            
            if duplicate_issue:
                # Update existing issue
                duplicate_issue.duplicate_count += 1
                duplicate_issue.priority_level = "critical"  # Upgrade to critical
                duplicate_issue.priority_score = max(duplicate_issue.priority_score, priority_score + 20)
                duplicate_group_id = duplicate_issue.duplicate_group_id or str(uuid.uuid4())
                duplicate_issue.duplicate_group_id = duplicate_group_id
                
                # Mark this as duplicate
                is_duplicate = True
                duplicate_count = duplicate_issue.duplicate_count
                
                print(f"[DUPLICATE] Merged with issue {duplicate_issue.id}, count now {duplicate_count}")
        
        # GAMIFICATION
        if user:
            # Award points based on report quality
            if is_fake:
                points = gamification.award_points(user.__dict__, 'fake_report')
                user.fake_reports += 1
                print(f"[GAMIFICATION] Fake report detected: {fake_reason}, {points} points deducted")
            elif is_duplicate:
                points = gamification.award_points(user.__dict__, 'duplicate_report')
                user.civic_points += points
                user.total_reports += 1
                print(f"[GAMIFICATION] Duplicate report: +{points} points")
            else:
                points = gamification.award_points(user.__dict__, 'valid_report')
                user.civic_points += points
                user.total_reports += 1
                user.valid_reports += 1
                user.reputation_score = min(1.0, user.reputation_score + 0.05)  # Increase reputation
                
                # Check for new badges
                new_badges = gamification.check_badges(user.__dict__)
                if new_badges:
                    current_badges = json.loads(user.badges or '[]')
                    current_badges.extend(new_badges)
                    user.badges = json.dumps(list(set(current_badges)))  # Remove duplicates
                    print(f"[GAMIFICATION] New badges earned: {new_badges}")
                
                print(f"[GAMIFICATION] Valid report: +{points} points, reputation: {user.reputation_score:.2f}")
        
        # Create issue record
        db_issue = Issue(
            reporter_id=reporter_id,
            title=title,
            description=description,
            issue_type=issue_type,
            image_path=url_path,
            latitude=latitude,
            longitude=longitude,
            location_description=location_description,
            priority_score=priority_score,
            priority_level=priority_level,
            ai_confidence=confidence,
            ai_detected_objects=json.dumps(detected_objects),
            status="reported",
            duplicate_group_id=duplicate_group_id,
            is_duplicate=is_duplicate,
            duplicate_count=duplicate_count
        )
        
        db.add(db_issue)
        db.commit()
        db.refresh(db_issue)
        
        return {
            "id": db_issue.id,
            "title": db_issue.title,
            "description": db_issue.description,
            "issue_type": db_issue.issue_type,
            "image_path": db_issue.image_path,
            "priority_level": db_issue.priority_level,
            "priority_score": db_issue.priority_score,
            "status": db_issue.status,
            "ai_detected_objects": db_issue.ai_detected_objects,
            "ai_confidence": db_issue.ai_confidence,
            "latitude": db_issue.latitude,
            "longitude": db_issue.longitude,
            "location_description": db_issue.location_description,
            "upvotes": db_issue.upvotes,
            "created_at": db_issue.created_at,
            "resolved_at": db_issue.resolved_at,
            "is_duplicate": db_issue.is_duplicate,
            "duplicate_group_id": db_issue.duplicate_group_id,
            "duplicate_count": db_issue.duplicate_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing issue: {str(e)}")


@router.get("/all")
async def get_all_issues(
    db: Session = Depends(get_db),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1),
    per_page: int = Query(12)
):
    """
    Get all issues with optional filtering, searching, and sorting
    """
    query = db.query(Issue)
    
    # Apply filters
    if priority:
        query = query.filter(Issue.priority_level == priority)
    if status:
        query = query.filter(Issue.status == status)
    if issue_type:
        query = query.filter(Issue.issue_type == issue_type)
    
    # Apply search filter (search across title, description, location)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Issue.title.ilike(search_pattern)) |
            (Issue.description.ilike(search_pattern)) |
            (Issue.location_description.ilike(search_pattern)) |
            (Issue.street_address.ilike(search_pattern))
        )
    
    # Get total count before pagination
    total_issues = query.count()
    
    # Apply sorting
    sort_column = None
    if sort_by == "created_at":
        sort_column = Issue.created_at
    elif sort_by == "priority_score":
        sort_column = Issue.priority_score
    elif sort_by == "upvotes":
        sort_column = Issue.upvotes
    elif sort_by == "title":
        sort_column = Issue.title
    else:
        sort_column = Issue.created_at
    
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    # Apply pagination
    skip = (page - 1) * per_page
    issues = query.offset(skip).limit(per_page).all()
    
    total_pages = (total_issues + per_page - 1) // per_page
    
    return {
        "issues": [
            IssueList(
                id=i.id,
                title=i.title,
                issue_type=i.issue_type,
                image_path=i.image_path,
                priority_level=i.priority_level,
                priority_score=i.priority_score,
                status=i.status,
                created_at=i.created_at,
                upvotes=i.upvotes,
                satisfaction_votes=i.satisfaction_votes,
                latitude=i.latitude,
                longitude=i.longitude,
                location_description=i.location_description,
                street_address=i.street_address,
                is_duplicate=i.is_duplicate,
                duplicate_count=i.duplicate_count,
                duplicate_group_id=i.duplicate_group_id
            )
            for i in issues
        ],
        "total_issues": total_issues,
        "total_pages": total_pages,
        "current_page": page,
        "per_page": per_page
    }


@router.get("/duplicates")
async def get_duplicate_groups(token: str = Query(...), db: Session = Depends(get_db)):
    """Get duplicate issue groups for authority review"""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not payload.get("is_authority", False):
        raise HTTPException(status_code=403, detail="User is not an authority")

    duplicate_issues = db.query(Issue).filter(Issue.duplicate_group_id != None).all()
    groups = {}
    for issue in duplicate_issues:
        if not issue.duplicate_group_id:
            continue
        if issue.duplicate_group_id not in groups:
            groups[issue.duplicate_group_id] = []
        groups[issue.duplicate_group_id].append(issue)

    duplicate_groups = []
    for group_id, issues in groups.items():
        duplicate_groups.append({
            "duplicate_group_id": group_id,
            "issues": [
                {
                    "id": i.id,
                    "title": i.title,
                    "description": i.description,
                    "issue_type": i.issue_type,
                    "image_path": i.image_path,
                    "priority_level": i.priority_level,
                    "priority_score": i.priority_score,
                    "status": i.status,
                    "created_at": i.created_at,
                    "upvotes": i.upvotes,
                    "satisfaction_votes": i.satisfaction_votes,
                    "latitude": i.latitude,
                    "longitude": i.longitude,
                    "location_description": i.location_description,
                    "street_address": i.street_address,
                    "is_duplicate": i.is_duplicate,
                    "duplicate_count": i.duplicate_count,
                    "duplicate_group_id": i.duplicate_group_id
                }
                for i in issues
            ]
        })

    return {"duplicate_groups": duplicate_groups}


@router.post("/confirm-duplicates")
async def confirm_duplicate_group(
    body: ConfirmDuplicatesRequest,
    token: str = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete duplicate issues from a duplicate group"""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not payload.get("is_authority", False):
        raise HTTPException(status_code=403, detail="User is not an authority")

    auth_user_id = int(payload.get("sub"))
    if auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    if not body.duplicate_group_id:
        raise HTTPException(status_code=400, detail="duplicate_group_id is required")

    if not body.issue_ids_to_delete:
        raise HTTPException(status_code=400, detail="issue_ids_to_delete must contain at least one issue id to delete")

    issues = db.query(Issue).filter(Issue.duplicate_group_id == body.duplicate_group_id).all()
    if not issues:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    delete_issues = [i for i in issues if i.id in body.issue_ids_to_delete]
    if not delete_issues:
        raise HTTPException(status_code=400, detail="No matching duplicate issues found for deletion")

    for issue in delete_issues:
        db.delete(issue)

    remaining_issues = [i for i in issues if i.id not in body.issue_ids_to_delete]
    if len(remaining_issues) == 1:
        remaining_issues[0].duplicate_group_id = None
        remaining_issues[0].duplicate_count = 1
    elif len(remaining_issues) > 1:
        for issue in remaining_issues:
            issue.duplicate_count = len(remaining_issues)

    db.commit()

    return {"message": f"Deleted {len(delete_issues)} duplicate issue(s) successfully."}


@router.get("/{issue_id}")
async def get_issue_detail(issue_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    reporter = db.query(User).filter(User.id == issue.reporter_id).first()
    
    # Get all updates for this issue
    updates = db.query(IssueUpdate).filter(IssueUpdate.issue_id == issue_id).order_by(IssueUpdate.created_at.desc()).all()
    
    return {
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "issue_type": issue.issue_type,
        "image_path": issue.image_path,
        "priority_level": issue.priority_level,
        "priority_score": issue.priority_score,
        "status": issue.status,
        "ai_detected_objects": issue.ai_detected_objects,
        "ai_confidence": issue.ai_confidence,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "location_description": issue.location_description,
        "street_address": issue.street_address,
        "upvotes": issue.upvotes,
        "satisfaction_votes": issue.satisfaction_votes,
        "created_at": issue.created_at,
        "resolved_at": issue.resolved_at,
        "updates": [
            {
                "id": u.id,
                "status_update": u.status_update,
                "notes": u.notes,
                "created_at": u.created_at
            }
            for u in updates
        ],
        "reporter": reporter
    }


@router.post("/{issue_id}/upvote")
async def upvote_issue(
    issue_id: int,
    token: str = Query(...),
    vote_type: str = Query("priority"),  # 'priority' or 'satisfaction'
    db: Session = Depends(get_db)
):
    """Add upvote to an issue (authenticated users only, one vote per type per user)"""
    from ..services.auth import decode_access_token
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = int(payload.get("sub"))
    
    # Check if issue exists
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Check if user has already voted with this type on this issue
    existing_upvote = db.query(IssueUpvote).filter(
        IssueUpvote.issue_id == issue_id,
        IssueUpvote.user_id == user_id,
        IssueUpvote.vote_type == vote_type
    ).first()
    
    if existing_upvote:
        raise HTTPException(status_code=400, detail=f"You have already voted for {vote_type} on this issue")
    
    # Create new upvote record with vote type
    upvote = IssueUpvote(issue_id=issue_id, user_id=user_id, vote_type=vote_type)
    db.add(upvote)
    
    # Increment appropriate vote count
    if vote_type == "satisfaction":
        issue.satisfaction_votes += 1
    else:  # priority
        issue.upvotes += 1
    
    # Recalculate priority (only for priority votes)
    if vote_type == "priority":
        priority_score, priority_level = PriorityScorer.calculate_priority_score(
            issue_type=issue.issue_type,
            ai_confidence=issue.ai_confidence,
            upvotes=issue.upvotes,
            status=issue.status
        )
        issue.priority_score = priority_score
        issue.priority_level = priority_level
    
    db.commit()
    db.refresh(issue)
    
    return {
        "upvotes": issue.upvotes,
        "satisfaction_votes": issue.satisfaction_votes,
        "priority_score": issue.priority_score,
        "message": f"✓ {vote_type.capitalize()} vote added"
    }


@router.get("/{issue_id}/has-upvoted")
async def has_user_upvoted(
    issue_id: int,
    token: str = Query(...),
    vote_type: str = Query("priority"),  # 'priority' or 'satisfaction'
    db: Session = Depends(get_db)
):
    """Check if current user has voted (with specific type) on this issue"""
    from ..services.auth import decode_access_token
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = int(payload.get("sub"))
    
    # Check if user has voted with this type
    upvote = db.query(IssueUpvote).filter(
        IssueUpvote.issue_id == issue_id,
        IssueUpvote.user_id == user_id,
        IssueUpvote.vote_type == vote_type
    ).first()
    
    return {"has_upvoted": upvote is not None}


@router.get("/{issue_id}/address")
async def get_issue_address(
    issue_id: int,
    db: Session = Depends(get_db)
):
    """Get street address for an issue (with caching), returns lat/lon fallback if geocoding fails"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # If address already cached, return it
    if issue.street_address:
        return {
            "location_description": issue.location_description,
            "street_address": issue.street_address,
            "latitude": issue.latitude,
            "longitude": issue.longitude
        }
    
    # Otherwise, try to get address from Nominatim and cache it
    address = await GeocodingService.get_address_from_coordinates(issue.latitude, issue.longitude)
    
    if address:
        issue.street_address = address
        db.commit()
        db.refresh(issue)
        return {
            "location_description": issue.location_description,
            "street_address": address,
            "latitude": issue.latitude,
            "longitude": issue.longitude
        }
    else:
        # If geocoding fails, return lat/lon format as fallback
        return {
            "location_description": issue.location_description,
            "street_address": f"Lat: {issue.latitude:.4f}, Lon: {issue.longitude:.4f}",
            "latitude": issue.latitude,
            "longitude": issue.longitude
        }


@router.patch("/{issue_id}/status")
async def update_issue_status(
    issue_id: int,
    new_status: str = Query(...),
    notes: str = Query(""),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Update issue status (for authorities only)"""
    from ..services.auth import decode_access_token
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user is authority
    is_authority = payload.get("is_authority", False)
    if not is_authority:
        raise HTTPException(status_code=403, detail="Only authorities can update issue status")
    
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    old_status = issue.status
    issue.status = new_status
    
    if new_status == "resolved":
        issue.resolved_at = datetime.utcnow()
    
    # Add update record
    update = IssueUpdate(
        issue_id=issue_id,
        authority_id=int(payload.get("sub")),
        status_update=f"{old_status} → {new_status}",
        notes=notes
    )
    
    db.add(update)
    db.commit()
    
    return {"status": issue.status, "updated_at": issue.updated_at}


@router.get("/by-type/{issue_type}")
async def get_issues_by_type(issue_type: str, db: Session = Depends(get_db)):
    """Get all issues of a specific type"""
    issues = db.query(Issue).filter(Issue.issue_type == issue_type).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "priority_level": i.priority_level,
            "status": i.status,
            "location": {"lat": i.latitude, "lon": i.longitude}
        }
        for i in issues
    ]


@router.get("/resolved/list")
async def get_resolved_issues(
    db: Session = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(50)
):
    """Get all resolved issues (visible to all users)"""
    issues = db.query(Issue).filter(Issue.status == "resolved").order_by(Issue.upvotes.desc(), Issue.resolved_at.desc()).offset(skip).limit(limit).all()
    
    return [
        IssueList(
            id=i.id,
            title=i.title,
            issue_type=i.issue_type,
            image_path=i.image_path,
            priority_level=i.priority_level,
            priority_score=i.priority_score,
            status=i.status,
            created_at=i.created_at,
            upvotes=i.upvotes,
            satisfaction_votes=i.satisfaction_votes,
            latitude=i.latitude,
            longitude=i.longitude,
            location_description=i.location_description,
            street_address=i.street_address
        )
        for i in issues
    ]


@router.delete("/{issue_id}/delete")
async def delete_issue(
    issue_id: int,
    user_id: int = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a resolved issue (authority only, requires 5+ upvotes) or duplicate issue"""
    from ..services.auth import decode_access_token
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user is authority
    is_authority = payload.get("is_authority", False)
    if not is_authority:
        raise HTTPException(status_code=403, detail="Only authorities can delete issues")
    
    # Get the issue
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Check if issue can be deleted (resolved with 5+ upvotes OR duplicate)
    can_delete = False
    delete_reason = ""
    
    if issue.status == "resolved" and issue.upvotes >= 5:
        can_delete = True
        delete_reason = "resolved issue with sufficient upvotes"
    elif issue.is_duplicate:
        can_delete = True
        delete_reason = "duplicate issue"
    
    if not can_delete:
        raise HTTPException(
            status_code=400, 
            detail="Issue cannot be deleted. Only resolved issues with 5+ upvotes or duplicate issues can be deleted."
        )
    
    # Delete the issue
    db.delete(issue)
    db.commit()
    
    return {"message": f"Issue deleted successfully ({delete_reason})", "issue_id": issue_id}


@router.post("/{issue_id}/complete")
async def mark_issue_complete(
    issue_id: int,
    completion_photo: UploadFile = File(...),
    notes: str = Form(""),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Mark an issue as complete with AI verification
    - Upload completion photo
    - AI compares with original issue photo
    - Auto-approve or reject based on verification
    """
    from ..services.auth import decode_access_token

    # Verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Check if user is authority
    is_authority = payload.get("is_authority", False)
    if not is_authority:
        raise HTTPException(status_code=403, detail="Only authorities can mark issues complete")

    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if issue.status == "resolved":
        raise HTTPException(status_code=400, detail="Issue is already resolved")

    try:
        # Save completion photo
        os.makedirs("uploads/completions", exist_ok=True)
        completion_filename = f"completion_{issue_id}_{completion_photo.filename}"
        completion_path = f"uploads/completions/{completion_filename}"
        url_path = f"/uploads/completions/{completion_filename}"

        with open(completion_path, "wb") as f:
            f.write(await completion_photo.read())

        # AI Verification
        verifier = CompletionVerifier()
        original_path = issue.image_path.replace("/uploads/", "uploads/")  # Convert URL to file path

        is_complete, confidence, verification_notes = verifier.verify_completion(
            original_path, completion_path
        )

        # Determine verification result
        if is_complete and confidence >= 0.8:
            verification_result = "approved"
            new_status = "resolved"
            issue.resolved_at = datetime.utcnow()
            issue.completion_verified = True
            issue.completion_confidence = confidence
            issue.completion_notes = verification_notes
        elif confidence >= 0.5:
            verification_result = "pending"
            new_status = "investigating"  # Needs manual review
            issue.completion_notes = f"AI verification inconclusive: {verification_notes}"
        else:
            verification_result = "rejected"
            new_status = "investigating"  # Send back for rework
            issue.completion_notes = f"AI verification failed: {verification_notes}"

        # Update issue status
        old_status = issue.status
        issue.status = new_status

        # Add update record with completion photo
        update = IssueUpdate(
            issue_id=issue_id,
            authority_id=int(payload.get("sub")),
            status_update=f"{old_status} → {new_status} (AI verification: {verification_result})",
            notes=f"{notes}\n\nAI Verification Result: {verification_result.upper()}\nConfidence: {confidence:.2f}\n{verification_notes}",
            completion_photo_path=url_path,
            verification_result=verification_result,
            verification_confidence=confidence
        )

        db.add(update)
        db.commit()
        db.refresh(issue)

        return {
            "status": issue.status,
            "verification_result": verification_result,
            "confidence": confidence,
            "notes": verification_notes,
            "completion_photo_path": url_path,
            "message": f"Issue marked as {new_status}. AI verification: {verification_result}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing completion: {str(e)}")


@router.get("/user/{user_id}/stats")
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user gamification stats and badges"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate additional stats
    total_upvotes_received = db.query(func.sum(Issue.upvotes)).filter(Issue.reporter_id == user_id).scalar() or 0

    return {
        "civic_points": user.civic_points,
        "reputation_score": user.reputation_score,
        "total_reports": user.total_reports,
        "valid_reports": user.valid_reports,
        "fake_reports": user.fake_reports,
        "badges": json.loads(user.badges or "[]"),
        "upvotes_received": total_upvotes_received,
        "accuracy_rate": (user.valid_reports / max(user.total_reports, 1)) * 100
    }
