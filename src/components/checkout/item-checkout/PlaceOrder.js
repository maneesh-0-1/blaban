import React from "react";
import { Stack, Typography, alpha, useMediaQuery, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import LoadingButton from "@mui/lab/LoadingButton";
import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { getAmountWithSign } from "helper-functions/CardHelpers";

const PlaceOrder = (props) => {
	const {
		placeOrder,
		orderLoading,
		isLoading,
		totalAmount,
		originalAmount,
		paymentMethod,
	} = props;
	const { t } = useTranslation();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const showStrikethrough =
		originalAmount && Number(originalAmount) > Number(totalAmount);

	const containerSx = isMobile
		? {
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 1500,
				px: 2,
				pt: 1.5,
				pb: "calc(14px + env(safe-area-inset-bottom, 0px))",
				backgroundColor: theme.palette.background.paper,
				borderTop: `1px solid ${theme.palette.divider}`,
				boxShadow: `0 -6px 22px ${alpha("#000", 0.14)}`,
		  }
		: {
				pt: 2.5,
				mt: 2,
				borderTop: `1px solid ${theme.palette.divider}`,
		  };

	const getButtonLabel = () => {
		if (paymentMethod === "cash_on_delivery") {
			return t("Place Order (Cash on Delivery)");
		}
		if (paymentMethod === "digital_payment") {
			return t("Pay & Place Order");
		}
		if (paymentMethod === "wallet") {
			return t("Pay with Wallet");
		}
		return t("Place Order");
	};

	const getButtonIcon = () => {
		if (paymentMethod === "cash_on_delivery") {
			return <PaymentsIcon sx={{ fontSize: "20px" }} />;
		}
		if (paymentMethod === "digital_payment") {
			return <CreditCardIcon sx={{ fontSize: "20px" }} />;
		}
		if (paymentMethod === "wallet") {
			return <AccountBalanceWalletIcon sx={{ fontSize: "20px" }} />;
		}
		return <ShoppingBagIcon sx={{ fontSize: "20px" }} />;
	};

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			gap={2}
			sx={containerSx}
		>
			<Stack spacing={0.25} minWidth={0}>
				<Typography
					sx={{
						fontSize: { xs: "12px", md: "13px" },
						color: theme.palette.text.secondary,
					}}
				>
					{t("Total Amount")}
				</Typography>
				<Stack direction="row" alignItems="baseline" gap={1}>
					<Typography
						sx={{
							fontWeight: 700,
							fontSize: { xs: "17px", md: "20px" },
							color: theme.palette.text.primary,
							whiteSpace: "nowrap",
						}}
					>
						{getAmountWithSign(totalAmount)}
					</Typography>
					{showStrikethrough && (
						<Typography
							sx={{
								fontSize: { xs: "12px", md: "13px" },
								color: theme.palette.text.secondary,
								textDecoration: "line-through",
								whiteSpace: "nowrap",
							}}
						>
							{getAmountWithSign(originalAmount)}
						</Typography>
					)}
				</Stack>
			</Stack>

			<LoadingButton
				onClick={placeOrder}
				loading={orderLoading}
				loadingPosition="start"
				startIcon={getButtonIcon()}
				loadingIndicator={
					<CircularProgress
						size={18}
						sx={{ color: "#ffffff" }}
					/>
				}
				variant="contained"
				disableElevation
				sx={{
					flexShrink: 0,
					minWidth: { xs: "160px", sm: "200px", md: "220px" },
					px: { xs: 2.5, md: 3.5 },
					py: { xs: 1.2, md: 1.35 },
					borderRadius: "10px",
					textTransform: "none",
					fontWeight: 700,
					fontSize: { xs: "14px", md: "15px" },
					backgroundColor: theme.palette.primary.main,
					color: "#ffffff",
					boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
					"&:hover": {
						backgroundColor: theme.palette.primary.dark,
						boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
					},
					"&.MuiLoadingButton-loading": {
						backgroundColor: theme.palette.primary.main,
						opacity: 0.85,
						color: "#ffffff",
					},
				}}
			>
				{getButtonLabel()}
			</LoadingButton>
		</Stack>
	);
};

PlaceOrder.propTypes = {};

export default PlaceOrder;
