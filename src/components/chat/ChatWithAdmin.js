import React from "react";
import { Avatar, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import { StyledBadge } from "./InfoCard";
import { Stack } from "@mui/system";

const ChatWithAdmin = ({ handleChannelOnClick, configData }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const language_direction = localStorage.getItem("direction");
	return (
		<CustomStackFullWidth
			direction="row"
			spacing={2}
			alignItems="center"
			padding="10px 15px 10px 10px"
			sx={{ cursor: "pointer" }}
			onClick={() =>
				handleChannelOnClick({
					receiver_type: "admin",
					sender_type: "customer",
					receiver: {
						f_name: configData?.business_name || "Admin",
						l_name: "",
						image_full_url: configData?.logo_full_url,
					},
				})
			}
		>
			<StyledBadge
				overlap="circular"
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Avatar
					src={configData?.logo_full_url}
					sx={{ width: "48px", height: "48px" }}
				/>
			</StyledBadge>
			<CustomStackFullWidth>
				<Stack
					direction="row"
					justifyContent="space-between"
					marginRight={language_direction === "rtl" ? "1rem" : "0rem"}
					sx={{ cursor: "pointer" }}
				>
					<Typography fontSize="14px" fontWeight="500">
						{configData?.business_name}
					</Typography>
				</Stack>
			</CustomStackFullWidth>
		</CustomStackFullWidth>
	);
};
export default ChatWithAdmin;
