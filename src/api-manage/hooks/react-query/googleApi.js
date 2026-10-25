import MainApi from "../../MainApi";

export const GoogleApi = {
  placeApiAutocomplete: (search) => {
    if (search && search !== "") {
      return MainApi.get(
        `/api/v1/config/place-api-autocomplete?search_text=${search}`
      );
    }
  },
  placeApiDetails: (placeId) => {
    return MainApi.get(`/api/v1/config/place-api-details?placeid=${placeId}`);
  },
  getZoneId: (location) => {
    return MainApi.get(
      `/api/v1/config/get-zone-id?lat=${location.lat}&lng=${location.lng}`
    );
  },
  distanceApi: (origin, destination) => {
    const originLat = origin?.latitude ?? origin?.lat;
    const originLng = origin?.longitude ?? origin?.lng;
    const destLat = destination?.latitude ?? destination?.lat;
    const destLng = destination?.longitude ?? destination?.lng;

    if (!originLat || !originLng || !destLat || !destLng) {
      return Promise.resolve({ data: null });
    }
    return MainApi.get(
      `/api/v1/config/distance-api?origin_lat=${originLat}&origin_lng=${originLng}&destination_lat=${destLat}&destination_lng=${destLng}&mode=WALK`
    );
  },
  geoCodeApi: (location) => {
    return MainApi.get(
      `/api/v1/config/geocode-api?lat=${location.lat}&lng=${location.lng}`
    );
  },
};
