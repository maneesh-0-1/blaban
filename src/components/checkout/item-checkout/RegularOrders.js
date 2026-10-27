import React, { useRef } from "react";
import { Box, Divider, Stack, Typography, alpha, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useDispatch } from "react-redux";
import { setRemoveItemFromCart, setIncrementToCartItem, setDecrementToCartItem } from "../../../redux/slices/cart";
import useDeleteCartItem from "../../../api-manage/hooks/react-query/add-cart/useDeleteCartItem";
import useCartItemUpdate from "../../../api-manage/hooks/react-query/add-cart/useCartItemUpdate";
import { getItemDataForAddToCart } from "../../product-details/product-details-section/helperFunction";
import { getTotalVariationsPrice } from "../../../utils/CustomFunctions";
import { getCurrentModuleType } from "../../../helper-functions/getCurrentModuleType";
import { out_of_limits, out_of_stock, cart_item_remove } from "../../../utils/toasterMessages";
import { onErrorResponse } from "../../../api-manage/api-error-response/ErrorResponses";
import { toast } from "react-hot-toast";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import { getAmountWithSign } from "../../../helper-functions/CardHelpers";
import { CustomStackFullWidth } from "../../../styled-components/CustomStyles.style";
import { handleProductValueWithOutDiscount } from "../../../utils/CustomFunctions";
import CustomImageContainer from "../../CustomImageContainer";
import { resolveProductImageUrl } from "helper-functions/CardHelpers";
import VariationContent from "../../added-cart-view/VariationContent";

export const VegNonveg = ({ theme, item, t }) => {
	return (
		<Stack
			sx={{
				position: "absolute",
				bottom: 0,
				left: 0,
				width: "100%",
				background: (theme) => theme.palette.primary.overLay,
				opacity: "0.6",
				padding: "10px",
				height: "30%",
				alignItems: "center",
				justifyContent: "center",
				borderBottomRightRadius: "10px",
				borderBottomLeftRadius: "10px",
			}}
		>
			<Typography align="center" color={theme.palette.neutral[100]}>
				{item?.veg === 0 ? t("Non-Veg") : t("Veg")}
			</Typography>
		</Stack>
	);
};

const RegularOrders = (props) => {
	const { configData, cartList, t, isSmall } = props;
	const dispatch = useDispatch();
	const guestId = typeof window !== "undefined" ? localStorage.getItem("guest_id") : null;
	const { mutate: deleteMutate, isLoading: removeIsLoading } = useDeleteCartItem();
	const { mutate: updateMutate, isLoading: updateIsLoading } = useCartItemUpdate();
	const debounceTimers = useRef({});

	const handleRemove = (cartItem) => {
		const cartIdAndGuestId = {
			cart_id: cartItem?.cartItemId ?? cartItem?.id,
			store_id: cartItem?.store_id ?? cartItem?.store?.id,
			guestId: guestId,
		};
		deleteMutate(cartIdAndGuestId, {
			onSuccess: () => {
				dispatch(setRemoveItemFromCart(cartItem));
				toast.success(t(cart_item_remove));
			},
		});
	};

	const handleIncrement = (cartItem) => {
		const updateQuantity = Number(cartItem?.quantity || 1) + 1;
		const price =
			cartItem?.price + getTotalVariationsPrice(cartItem?.food_variations);
		const productPrice = price * updateQuantity;
		const mainPrice =
			getCurrentModuleType() === "food"
				? productPrice
				: (cartItem?.selectedOption?.length > 0
						? cartItem?.selectedOption?.[0]?.price
						: cartItem?.price) * updateQuantity;
		const itemObject = getItemDataForAddToCart(
			cartItem,
			updateQuantity,
			mainPrice,
			guestId
		);

		if (getCurrentModuleType() !== "food") {
			if (cartItem?.stock <= cartItem?.quantity) {
				toast.error(t(out_of_stock));
				return;
			}
			if (
				cartItem?.maximum_cart_quantity &&
				cartItem?.maximum_cart_quantity <= cartItem?.quantity
			) {
				toast.error(t(out_of_limits), { id: "out-of-limits" });
				return;
			}
		} else if (
			cartItem?.maximum_cart_quantity &&
			cartItem?.maximum_cart_quantity <= cartItem?.quantity
		) {
			toast.error(t(out_of_limits));
			return;
		}

		// ── Instant Optimistic Update (0ms) ──
		dispatch(
			setIncrementToCartItem({
				...cartItem,
				totalPrice: productPrice,
				quantity: updateQuantity,
			})
		);

		const timerKey = String(cartItem?.cartItemId ?? cartItem?.id);
		if (debounceTimers.current[timerKey]) {
			clearTimeout(debounceTimers.current[timerKey]);
		}
		debounceTimers.current[timerKey] = setTimeout(() => {
			updateMutate(itemObject, {
				onError: (err) => {
					dispatch(setDecrementToCartItem(cartItem));
					onErrorResponse(err);
				},
			});
		}, 250);
	};

	const handleDecrement = (cartItem) => {
		if (cartItem?.quantity <= 1) {
			handleRemove(cartItem);
			return;
		}
		const updateQuantity = cartItem?.quantity - 1;
		const price =
			cartItem?.price + getTotalVariationsPrice(cartItem?.food_variations);
		const productPrice = price * updateQuantity;
		const mainPrice =
			getCurrentModuleType() === "food"
				? productPrice
				: (cartItem?.selectedOption?.length > 0
						? cartItem?.selectedOption?.[0]?.price
						: cartItem?.price) * updateQuantity;
		const itemObject = getItemDataForAddToCart(
			cartItem,
			updateQuantity,
			mainPrice,
			guestId
		);

		// ── Instant Optimistic Update (0ms) ──
		dispatch(
			setDecrementToCartItem({
				...cartItem,
				totalPrice: productPrice,
				quantity: updateQuantity,
			})
		);

		const timerKey = String(cartItem?.cartItemId ?? cartItem?.id);
		if (debounceTimers.current[timerKey]) {
			clearTimeout(debounceTimers.current[timerKey]);
		}
		debounceTimers.current[timerKey] = setTimeout(() => {
			updateMutate(itemObject, {
				onError: (err) => {
					dispatch(setIncrementToCartItem(cartItem));
					onErrorResponse(err);
				},
			});
		}, 250);
	};

	const theme = useTheme();
	const neutralBase =
		theme.palette.neutral?.[400] || theme.palette.text.secondary;

	if (!cartList || cartList.length === 0) {
		return (
			<CustomStackFullWidth
				direction="row"
				alignItems="flex-start"
				spacing={2}
			>
				<Skeleton variant="rectangular" height="90px" width="95px" />
				<Stack>
					<Skeleton variant="text" width="50px" />
					<Skeleton variant="text" width="50px" />
					<Skeleton variant="text" width="50px" />
				</Stack>
			</CustomStackFullWidth>
		);
	}

	return (
		<Stack width="100%" divider={<Divider flexItem />}>
			{cartList.map((item, index) => (
				<Stack
					key={index}
					direction="row"
					alignItems="flex-start"
					spacing={1.5}
					py={{ xs: 1, md: 1.25 }}
				>
					<Box
						sx={{
							width: { xs: 48, md: 56 },
							height: { xs: 48, md: 56 },
							borderRadius: "8px",
							overflow: "hidden",
							flexShrink: 0,
							backgroundColor: alpha(neutralBase, 0.08),
						}}
					>
						<CustomImageContainer
							height="100%"
							width="100%"
							src={resolveProductImageUrl(item, configData)}
							alt={item?.name}
							objectfit="cover"
							borderRadius="8px"
							loading="lazy"
						/>
					</Box>

					<Stack flex={1} minWidth={0} spacing={0.25}>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: { xs: "13px", md: "14px" },
								color: theme.palette.text.primary,
								lineHeight: 1.25,
							}}
						>
							{item.name}
						</Typography>
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: { xs: "13px", md: "14px" },
								color: theme.palette.text.primary,
							}}
						>
							{getAmountWithSign(
								handleProductValueWithOutDiscount(item),
							)}
						</Typography>
						{item.is_prescription_required !== 0 && (
							<Typography
								sx={{
									fontSize: "10px",
									color: theme.palette.error.main,
								}}
							>
								{t("Prescription Required")}
							</Typography>
						)}
						<VariationContent cartItem={item} />
					</Stack>

					<Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
						<Stack
							direction="row"
							alignItems="center"
							sx={{
								border: "1px solid",
								borderColor: alpha(neutralBase, 0.25),
								borderRadius: "8px",
								backgroundColor: alpha(neutralBase, 0.05),
								p: "2px",
							}}
						>
							<IconButton
								size="small"
								onClick={() => handleDecrement(item)}
								disabled={removeIsLoading}
								sx={{
									p: "3px",
									color: theme.palette.text.primary,
									"&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
								}}
							>
								<RemoveIcon sx={{ fontSize: 15 }} />
							</IconButton>

							<Typography
								sx={{
									fontWeight: 700,
									fontSize: { xs: "12px", md: "13px" },
									color: theme.palette.text.primary,
									minWidth: 24,
									textAlign: "center",
									px: 0.5,
								}}
							>
								{item.quantity}
							</Typography>

							<IconButton
								size="small"
								onClick={() => handleIncrement(item)}
								disabled={false}
								sx={{
									p: "3px",
									color: theme.palette.text.primary,
									"&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
								}}
							>
								<AddIcon sx={{ fontSize: 15 }} />
							</IconButton>
						</Stack>

						<Tooltip title={t("Remove item")}>
							<IconButton
								size="small"
								onClick={() => handleRemove(item)}
								disabled={removeIsLoading || updateIsLoading}
								sx={{
									color: theme.palette.error.main,
									backgroundColor: alpha(theme.palette.error.main, 0.08),
									"&:hover": {
										backgroundColor: alpha(theme.palette.error.main, 0.18),
									},
									p: "5px",
									borderRadius: "8px",
								}}
							>
								<DeleteOutlineIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
			))}
		</Stack>
	);
};

RegularOrders.propTypes = {};

export default RegularOrders;
