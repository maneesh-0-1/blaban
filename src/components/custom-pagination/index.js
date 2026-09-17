import React from "react";
import { Box } from "@mui/system";
import { Pagination } from "@mui/lab";
import PropTypes from "prop-types";

const CustomPagination = (props) => {
  const { total_size, page_limit, offset, setOffset } = props;
  const numTotal = Number(total_size);
  const numLimit = Number(page_limit) || 10;
  const count = Math.ceil(numTotal / numLimit);

  if (isNaN(count) || count <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        marginTop: "auto",
      }}
      padding={{ xs: "10px 0px 0px 0px", md: "30px 0px 70px 0px" }}
    >
      <Pagination
        count={count}
        onChange={(e, value) => {
          setOffset(value);
        }}
        page={Number(offset) || 1}
      />
    </Box>
  );
};

CustomPagination.propTypes = {
  total_size: PropTypes.number.isRequired,
  page_limit: PropTypes.number.isRequired,
  offset: PropTypes.string.isRequired,
  setOffset: PropTypes.func.isRequired,
};

export default CustomPagination;
