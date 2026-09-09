import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setSelectedModule } from "redux/slices/utils";
import useGetModule from "api-manage/hooks/react-query/useGetModule";
import { getCurrentModuleId } from "helper-functions/getCurrentModuleType";
import toast from "react-hot-toast";
import { setModules } from "redux/slices/configData";
import { getSavedModuleIdentifier, saveModuleParam } from "../../utils/moduleParamManager";

const ModuleChecker = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data, refetch } = useGetModule();
  
  useEffect(() => {
    if (data?.length > 0) {
      dispatch(setModules(data));
    }
  }, [data, dispatch]);

  // Sync URL / Default -> Storage & Redux
  useEffect(() => {
    if (!data || data.length === 0) return;

    const moduleIdFromUrl = router.query.module || router.query.module_id;
    const moduleIdFromStorage = getCurrentModuleId();

    if (moduleIdFromUrl) {
      const moduleIdStr = String(moduleIdFromUrl);
      const matchedModule = data.find(
        (item) =>
          String(item?.slug) === moduleIdStr || String(item?.id) === moduleIdStr
      );
      const moduleToSet = matchedModule || data[0];
      localStorage.setItem("module", JSON.stringify(moduleToSet));
      saveModuleParam(moduleToSet?.id, moduleToSet?.slug);
      dispatch(setSelectedModule(moduleToSet));
    } else if (!moduleIdFromStorage) {
      // First visit / no module in URL or storage: auto-select the first/default module (e.g. B.Laban)
      const defaultModule = data[0];
      if (defaultModule) {
        localStorage.setItem("module", JSON.stringify(defaultModule));
        saveModuleParam(defaultModule?.id, defaultModule?.slug);
        dispatch(setSelectedModule(defaultModule));
        const identifier = defaultModule?.slug || defaultModule?.id;
        if (identifier && router.isReady && router.pathname === "/home") {
          const { module_id: _legacy, ...restQuery } = router.query;
          router.replace(
            {
              pathname: router.pathname,
              query: { ...restQuery, module: String(identifier) },
            },
            undefined,
            { shallow: true, scroll: false }
          );
        }
      }
    } else {
      const matchedModule = data.find(
        (item) => String(item?.id) === String(moduleIdFromStorage)
      );
      if (matchedModule) {
        dispatch(setSelectedModule(matchedModule));
      }
    }
  }, [data, router.query.module, router.query.module_id, router.isReady, router.pathname, dispatch]);

  return null;
};

export default ModuleChecker;
