import React, { useState, useRef, useCallback } from 'react';
import api from '../utils/api';
import axios from 'axios';
import LocationPickerMap from '../components/LocationPickerMap';


function ReportPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    location_description: '',
    issue_type: 'auto'
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  const issueTypes = [
    { value: 'auto', label: '🤖 Auto-Detect (AI Analysis)' },
    { value: 'road_damage', label: '🛣️ Road Damage (Pothole, Crack)' },
    { value: 'garbage', label: '🗑️ Garbage (Litter, Trash)' },
    { value: 'water_leak', label: '💧 Water Leak (Puddle, Drainage)' },
    { value: 'traffic', label: '🚗 Traffic Issue (Congestion, Signal)' },
    { value: 'construction', label: '🏗️ Construction (Blocked Road)' },
    { value: 'landslide', label: '⛰️ Landslide (Erosion, Collapse)' },
    { value: 'other', label: '📌 Other' }
  ];

  // Enhanced form validation
  const isWithinKangraDistrict = (lat, lng) => {
    return lat >= 31.0 && lat <= 32.7 && lng >= 75.0 && lng <= 77.8;
  };

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!image) {
      errors.image = 'Please select an image';
    } else if (image.size > 10 * 1024 * 1024) { // 10MB limit
      errors.image = 'Image size must be less than 10MB';
    }

    if (!formData.latitude || !formData.longitude) {
      errors.location = 'Please provide location coordinates';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        errors.location = 'Invalid latitude';
      }
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        errors.location = 'Invalid longitude';
      }
      if (!errors.location && !isWithinKangraDistrict(lat, lng)) {
        errors.location = 'Location must be within Kangra district, Himachal Pradesh';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, image]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Enhanced location search with debouncing
  const handleLocationSearch = useCallback(async (query) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await axios.get('/api/geocode/search', {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          countrycodes: 'in',
          viewbox: '75.0,32.7,77.8,31.0',
          bounded: 1
        }
      });
      const filtered = (response.data || []).filter((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return !Number.isNaN(lat) && !Number.isNaN(lon) && isWithinKangraDistrict(lat, lon);
      });
      setLocationSuggestions(filtered);
      setShowLocationSuggestions(filtered.length > 0);
    } catch (err) {
      console.error('Error fetching location suggestions:', err);
      setLocationSuggestions([]);
    }
  }, []);

  const handleLocationSelect = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    if (!isWithinKangraDistrict(lat, lng)) {
      setError('Selected location must be within Kangra district, Himachal Pradesh.');
      setValidationErrors(prev => ({ ...prev, location: 'Location must be within Kangra district' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_description: suggestion.display_name
    }));
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setValidationErrors(prev => ({ ...prev, location: '' }));
    setError('');
  };

  // Enhanced image handling with drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect({ target: { files: e.dataTransfer.files } });
    }
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, image: 'Image size must be less than 10MB' }));
        return;
      }

      setImage(file);
      setValidationErrors(prev => ({ ...prev, image: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));

          if (!isWithinKangraDistrict(lat, lng)) {
            setError('Your current location is outside Kangra district, Himachal Pradesh. Please choose a local point on the map or enter valid coordinates within the district.');
            setValidationErrors(prev => ({ ...prev, location: 'Location must be within Kangra district' }));
            setLoading(false);
            return;
          }

          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          setValidationErrors(prev => ({ ...prev, location: '' }));
          setError('');
          setLoading(false);
        },
        (error) => {
          let errorMessage = 'Unable to get your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setError(errorMessage);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below and try again.');
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append('file', image);
      form.append('title', formData.title.trim());
      form.append('description', formData.description.trim());
      form.append('latitude', parseFloat(formData.latitude));
      form.append('longitude', parseFloat(formData.longitude));
      form.append('location_description', formData.location_description.trim());
      form.append('issue_type', formData.issue_type);
      form.append('token', localStorage.getItem('authToken'));

      console.log('Submitting form data:', {
        title: formData.title,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        description: formData.description,
        location_description: formData.location_description,
        issue_type: formData.issue_type
      });

      const response = await api.post('/api/issues/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          // Could add upload progress here if needed
        }
      });

      setAiResult(response.data);
      const confidenceText = response.data.ai_confidence > 0.3 ?
        ` | 🎯 Detected: ${response.data.issue_type} (${(response.data.ai_confidence * 100).toFixed(0)}% confident)` :
        '';
      setSuccess(`✓ Issue reported successfully! ID: ${response.data.id}${confidenceText}`);

      // Check if this is a duplicate and redirect authorities to duplicates page
      if (response.data.is_duplicate && localStorage.getItem('isAuthority') === 'true') {
        setTimeout(() => {
          alert('This issue appears to be a duplicate. Redirecting to duplicates management page...');
          window.location.href = '/duplicates';
        }, 2000);
      }

      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          latitude: '',
          longitude: '',
          location_description: '',
          issue_type: 'auto'
        });
        setImage(null);
        setPreview(null);
        setAiResult(null);
        setValidationErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
    } catch (err) {
      console.error('Error submitting issue:', err);

      let errorMessage = 'Error submitting issue. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.response?.status === 413) {
        errorMessage = 'Image file is too large. Please choose a smaller image.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Invalid file type. Please upload a valid image.';
      } else if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || e.message || JSON.stringify(e)).join('; ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-form">
        <h2>📝 Report an Issue</h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Upload an image and describe the problem. Our AI will categorize it and calculate priority.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Issue Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Large pothole on Main Street"
              className={validationErrors.title ? 'error' : ''}
              required
            />
            {validationErrors.title && <span className="error-text">{validationErrors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide additional details about the issue..."
              rows="3"
            />
          </div>

          {/* Enhanced Image Upload with Drag & Drop */}
          <div className="form-group">
            <label htmlFor="image">Upload Image *</label>
            <div
              className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${validationErrors.image ? 'error' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                required
              />

              {preview ? (
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p>Click to select or drag & drop an image</p>
                  <small>Supported formats: JPG, PNG, GIF (max 10MB)</small>
                </div>
              )}
            </div>
            {validationErrors.image && <span className="error-text">{validationErrors.image}</span>}
          </div>

          {/* Issue Type Selector */}
          <div className="form-group">
            <label htmlFor="issue_type">Issue Type *</label>
            <select
              id="issue_type"
              name="issue_type"
              value={formData.issue_type}
              onChange={handleInputChange}
              required
            >
              {issueTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#999' }}>
              📌 Select the category that best describes this issue
            </p>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>📍 Location (Kangra district, Himachal Pradesh only)</label>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn btn-secondary"
              >
                📍 Get My Location
              </button>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="btn btn-secondary"
              >
                {showMapPicker ? '✓ Close Map' : '🗺️ Pick on Map'}
              </button>
            </div>

            {/* Map Picker */}
            {showMapPicker && (
              <div style={{ marginBottom: '1.5rem' }}>
                <LocationPickerMap
                  onSelect={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: location.latitude,
                      longitude: location.longitude
                    }));
                  }}
                  initialLocation={formData.latitude && formData.longitude ? {
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude)
                  } : null}
                  searchQuery={formData.location_description}
                />
              </div>
            )}
          </div>

          {/* Latitude */}
          <div className="form-group">
            <label htmlFor="latitude">Latitude *</label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              step="0.000001"
              value={formData.latitude}
              onChange={handleInputChange}
              placeholder="e.g., 40.7128"
              required
            />
          </div>

          {/* Longitude */}
          <div className="form-group">
            <label htmlFor="longitude">Longitude *</label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              step="0.000001"
              value={formData.longitude}
              onChange={handleInputChange}
              placeholder="e.g., -74.0060"
              required
            />
          </div>

          {/* Location Description with Search */}
          <div className="form-group">
            <label htmlFor="location_description">Location Description (with search)</label>
            <input
              type="text"
              id="location_description"
              name="location_description"
              value={formData.location_description}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  location_description: value
                }));
                handleLocationSearch(value);
              }}
              placeholder="Search for a place or address..."
              autoComplete="off"
            />
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '0.5rem',
                backgroundColor: '#fff'
              }}>
                {locationSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLocationSelect(suggestion)}
                    style={{
                      padding: '0.75rem',
                      borderBottom: idx < locationSuggestions.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    {suggestion.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="ai-detection-result">
              <h4>🤖 AI Analysis Result</h4>
              <p><strong>Issue Type:</strong>
                <span className="detection-badge">{aiResult.issue_type}</span>
              </p>
              <p><strong>Confidence:</strong> {(aiResult.ai_confidence * 100).toFixed(1)}%</p>
              <p><strong>Priority Level:</strong>
                <span className={`priority-${aiResult.priority_level}`} style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                  {aiResult.priority_level.toUpperCase()}
                </span>
              </p>
              <p><strong>Priority Score:</strong> {aiResult.priority_score.toFixed(1)}/100</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Processing...
              </>
            ) : (
              '🚀 Submit Issue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportPage;
