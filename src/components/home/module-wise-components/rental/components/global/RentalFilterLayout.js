import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import CustomContainer from "components/container";

/**
 * RentalFilterLayout — demo placeholder layout for rental search/listing pages.
 *
 * Renders the page's `topContent` (banner + search panel) and a results area
 * below it. Replace the results area with the real filter sidebar + vehicle
 * grid once the rental search API is wired up.
 *
 * Props:
 *  - topContent:  node rendered above the results area (banner, search bar…)
 *  - children:    optional results/list content
 *  - api_endpoint: search endpoint the page intends to call (demo: unused)
 *  - isSticky:    whether the page's sticky search bar is currently active
 */
const RentalFilterLayout = ({
  topContent,
  children,
  api_endpoint,
  isSticky,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: "60vh",
        paddingBottom: "40px",
      }}
    >
      {topContent}

      <CustomContainer>
        <Stack
          spacing={2}
          sx={{
            marginTop: isSticky ? "80px" : "24px",
            padding: { xs: "16px", md: "24px" },
            borderRadius: "12px",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {children || (
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, textAlign: "center" }}
            >
              Rental search results will appear here.
            </Typography>
          )}
        </Stack>
      </CustomContainer>
    </Box>
  );
};

export default RentalFilterLayout;
