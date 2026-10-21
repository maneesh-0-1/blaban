import { useQuery } from "react-query";
import MainApi from "../../../MainApi";

const getDeliveryData = async () => {
  try {
    const { data } = await MainApi.get("/api/v1/delivery-areas/data");
    return data;
  } catch (err) {
    return { success: false, branches: [], governorates: [] };
  }
};

const useGetDeliveryAreas = () => {
  return useQuery(["delivery-areas-data"], getDeliveryData, {
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export default useGetDeliveryAreas;
