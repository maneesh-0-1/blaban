import React, { useState } from "react";

import {
	CustomListItem,
	CustomStackFullWidth,
} from "../../../styled-components/CustomStyles.style";
import ListItemText from "@mui/material/ListItemText";
import { IconButton, Skeleton, Tooltip, Typography, alpha } from "@mui/material";
import Radio from "@mui/material/Radio";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { useTheme } from "@mui/material/styles";

import { Stack } from "@mui/system";

import { CustomTypographyEllipsis } from "../../../styled-components/CustomTypographies.style";
import DeleteAddress from "../../address/DeleteAddress";

// Placeholder rows shown while address list is loading
const AddressSkeletonItem = () => (
	<Stack direction="row" alignItems="center" gap={1} px={0.5}>
		<Skeleton variant="circular" width={20} height={20} sx={{ flexShrink: 0 }} />
		<Stack flex={1} spacing={0.5}>
			<Skeleton variant="text" width="40%" height={18} />
			<Skeleton variant="text" width="80%" height={14} />
		</Stack>
	</Stack>
);

const AddressSelectionList = (props) => {
	const theme = useTheme();
	const {
		data,
		allAddress,
		handleLatLng,
		t,
		address,
		isRefetching,
		refetch,
		configData,
		setSelectedAddress,
		renderOnNavbar,
		isLoading,
		onEditAddress,
	} = props;

	const [deleteTargetAddress, setDeleteTargetAddress] = useState(null);

	if (isLoading) {
		return (
			<Stack gap="15px" py={1}>
				{[1, 2, 3].map((i) => (
					<AddressSkeletonItem key={i} />
				))}
			</Stack>
		);
	}

	return (
		<>
			<Stack gap="15px">
				{data &&
					allAddress?.length > 0 &&
					data?.addresses?.map((item, index) => (
						<Stack key={item.id}>
							<CustomListItem
								border={
									item.id === address?.id
										? `1px solid ${theme.palette.primary.main}`
										: `1px solid ${theme.palette.neutral[200]}`
								}
								onClick={() => handleLatLng(item)}
								alignItems="flex-start"
								selected={item.id === address?.id}
								cursor="pointer"
							>
								<CustomStackFullWidth
									direction="row"
									alignItems="center"
									justifyContent="space-between"
								>
									<CustomStackFullWidth
										direction="row"
										alignItems="flex-start"
										sx={{ flex: 1, minWidth: 0, mr: 1 }}
									>
										<Radio
											checked={item.id === address?.id}
											row
											aria-labelledby="demo-row-radio-buttons-group-label"
											name="row-radio-buttons-group"
											sx={{ marginTop: "-2px" }}
										/>
										<ListItemText
											primary={
												<Typography
													textTransform="capitalize"
													fontSize={{
														xs: "13px",
														sm: "14px",
														md: "16px",
													}}
													fontWeight={
														item.id === address?.id
															? "600"
															: "600"
													}
												>
													{t(item.address_type)}
												</Typography>
											}
											secondary={
												<CustomTypographyEllipsis
													sx={{
														fontSize: {
															xs: "10px",
															md: "12px",
															maxWidth:
																renderOnNavbar ===
																"true"
																	? "190px"
																	: "100%",
														},
													}}
												>
													{item.address}
												</CustomTypographyEllipsis>
											}
										/>
									</CustomStackFullWidth>

									<Stack
										direction="row"
										alignItems="center"
										spacing={0.5}
										sx={{ flexShrink: 0 }}
										onClick={(e) => e.stopPropagation()}
									>
										{typeof onEditAddress === "function" && (
											<Tooltip title={t("Edit")}>
												<IconButton
													size="small"
													aria-label={t("Edit Address")}
													onClick={(e) => {
														e.stopPropagation();
														onEditAddress(item);
													}}
													sx={{
														p: "5px",
														color: theme.palette.primary.main,
														backgroundColor: alpha(theme.palette.primary.main, 0.08),
														borderRadius: "6px",
														"&:hover": {
															backgroundColor: alpha(theme.palette.primary.main, 0.18),
														},
													}}
												>
													<EditOutlinedIcon sx={{ fontSize: "16px" }} />
												</IconButton>
											</Tooltip>
										)}
										<Tooltip title={t("Delete")}>
											<IconButton
												size="small"
												aria-label={t("Delete Address")}
												onClick={(e) => {
													e.stopPropagation();
													setDeleteTargetAddress(item);
												}}
												sx={{
													p: "5px",
													color: "#f44336",
													backgroundColor: alpha("#f44336", 0.08),
													borderRadius: "6px",
													"&:hover": {
														backgroundColor: alpha("#f44336", 0.18),
													},
												}}
											>
												<DeleteOutlineOutlinedIcon sx={{ fontSize: "16px" }} />
											</IconButton>
										</Tooltip>
									</Stack>
								</CustomStackFullWidth>
							</CustomListItem>
						</Stack>
					))}

				{/* Empty state */}
				{!isLoading && data && data?.addresses?.length === 0 && (
					<Stack alignItems="center" spacing={1.5} py={1.5}>
						<Stack
							alignItems="center"
							justifyContent="center"
							sx={{
								width: 52,
								height: 52,
								borderRadius: "50%",
								bgcolor: theme.palette.primary.main + "14",
							}}
						>
							<i
								className="fi fi-rr-map-marker"
								style={{
									fontSize: "22px",
									display: "flex",
									lineHeight: 1,
									color: theme.palette.primary.main,
								}}
							/>
						</Stack>
						<Stack alignItems="center" spacing={0.5}>
							<Typography
								fontSize="14px"
								fontWeight={600}
								color="text.primary"
							>
								{t("No saved addresses yet")}
							</Typography>
							<Typography
								fontSize="12px"
								color="text.secondary"
								textAlign="center"
								sx={{ maxWidth: "200px", lineHeight: 1.5 }}
							>
								{t("Add a new address to get started")}
							</Typography>
						</Stack>
					</Stack>
				)}
			</Stack>

			{deleteTargetAddress && (
				<DeleteAddress
					open={Boolean(deleteTargetAddress)}
					handleClose={() => setDeleteTargetAddress(null)}
					addressId={deleteTargetAddress.id}
					refetch={refetch}
				/>
			)}
		</>
	);
};

AddressSelectionList.propTypes = {};

export default AddressSelectionList;
