import { useQuery } from "react-query";
import deliveryBranchesData from "components/branch-area-selector/deliveryBranchesData.json";

const FALLBACK_BRANCHES = [
  { id: 4, name: "Salmiya Branch", name_ar: "فرع السالمية", address: "Salem Al Mubarak St, Salmiya, Kuwait", phone: "+965 60609079", slug: "salmiya-branch" },
  { id: 5, name: "Hawally Branch", name_ar: "فرع حولي", address: "Baghdad St, Midan Hawalli, Kuwait", phone: "+965 60609079", slug: "hawally-branch" },
  { id: 7, name: "Farwaniya Branch", name_ar: "فرع الفروانية", address: "Habib Munawir St, Farwaniya, Kuwait", phone: "+965 60609079", slug: "farwaniya-branch" },
  { id: 6, name: "Fahaheel Branch", name_ar: "فرع الفحيحيل", address: "Dabbous St, Fahaheel, Kuwait", phone: "+965 60609079", slug: "fahaheel-branch" },
];

const getDeliveryData = async () => {
  return {
    success: true,
    branches: FALLBACK_BRANCHES,
    governorates: deliveryBranchesData,
  };
};

const useGetDeliveryAreas = () => {
  return useQuery(["delivery-areas-data"], getDeliveryData, {
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export default useGetDeliveryAreas;
