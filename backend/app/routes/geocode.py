from fastapi import APIRouter, HTTPException, Query
from ..services.geocoding import GeocodingService

router = APIRouter(prefix="/api/geocode", tags=["geocode"])


@router.get("/search")
async def search_location(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    countrycodes: str = Query("in"),
    viewbox: str = Query("75.0,32.7,77.8,31.0"),
    bounded: int = Query(1, ge=0, le=1)
):
    """Search for a location using the backend geocoding proxy."""
    try:
        results = await GeocodingService.search_address(
            query=q,
            limit=limit,
            countrycodes=countrycodes,
            viewbox=viewbox,
            bounded=bool(bounded)
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Geocoding search failed: {e}")


@router.get("/reverse")
async def reverse_geocode(
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    """Reverse geocode coordinates through the backend proxy."""
    address = await GeocodingService.get_address_from_coordinates(latitude, longitude)
    if address:
        return {"address": address}
    raise HTTPException(status_code=404, detail="Address not found")
