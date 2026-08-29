import { useQuery } from "react-query";
import { distance_api } from "../../../ApiRoutes";
import {
  onErrorResponse,
  onSingleErrorResponse,
} from "../../../api-error-response/ErrorResponses";
import MainApi from "../../../MainApi";
const getDistance = async (origin, destination, mode) => {
  const originLat = origin?.latitude ?? origin?.lat;
  const originLng = origin?.longitude ?? origin?.lng;
  const destLat = destination?.latitude ?? destination?.lat;
  const destLng = destination?.longitude ?? destination?.lng;

  if (originLat && originLng && destLat && destLng) {
    const { data } = await MainApi.get(
      `${distance_api}?origin_lat=${originLat}&origin_lng=${originLng}&destination_lat=${destLat}&destination_lng=${destLng}&mode=${mode || "WALK"}`
    );
    return data;
  }
  return null;
};

export default function useGetDistance(origin, destination, mode) {
  return useQuery(
    ["distance", origin, destination],
    () => getDistance(origin, destination, mode),
    {
      enabled: false,
      onError: onSingleErrorResponse,
    }
  );
}
