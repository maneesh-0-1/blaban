import React, { memo, useEffect, useState } from "react";
import { CustomImageContainerStyled } from "styled-components/CustomStyles.style";
import placeholder from "../../public/static/no-image-found.png";
import { Box } from "@mui/system";

const CustomImageContainer = ({
  cursor = undefined,
  mdHeight = undefined,
  maxWidth = undefined,
  height = undefined,
  width = undefined,
  objectfit = undefined,
  minwidth = undefined,
  src = undefined,
  alt = undefined,
  borderRadius = undefined,
  marginBottom = undefined,
  smHeight = undefined,
  smMb = undefined,
  smMaxWidth = undefined,
  smWidth = undefined,
  aspectRatio = undefined,
  padding = undefined,
  loading = undefined,
  priority = false,
  fetchpriority = undefined,
  bg = undefined,
  borderBottomRightRadius = undefined,
  ...rest
}) => {
  const initialSrc = src ? src : (placeholder?.src || "");
  const [imageFile, setState] = useState(initialSrc);

  useEffect(() => {
    setState(src ? src : (placeholder?.src || ""));
  }, [src]);

  const effectiveLoading = priority ? "eager" : (loading || "lazy");
  const effectiveFetchPriority = fetchpriority || (priority ? "high" : undefined);

  return (
    <CustomImageContainerStyled
      height={height}
      width={width}
      objectfit={objectfit}
      minwidth={minwidth}
      border_radius={borderRadius}
      margin_bottom={marginBottom}
      smheight={smHeight}
      sm_mb={smMb}
      max_width={maxWidth}
      sm_max_width={smMaxWidth}
      sm_width={smWidth}
      md_height={mdHeight}
      cursor={cursor}
      aspect_ratio={aspectRatio}
      padding={padding}
      bg={bg}
      borderBottomRightRadius={borderBottomRightRadius}
      {...rest}
    >
      {!imageFile ? (
        <Box
          sx={{
            height: "100%",
            width: "100%",
            border: (theme) => `1px solid ${theme.palette.neutral[200]}`,
          }}
        />
      ) : (
        <img
          src={imageFile}
          alt={alt || "image"}
          onError={() => {
            setState(placeholder?.src);
          }}
          loading={effectiveLoading}
          {...(effectiveFetchPriority ? { fetchPriority: effectiveFetchPriority } : {})}
        />
      )}
    </CustomImageContainerStyled>
  );
};
export default memo(CustomImageContainer);
