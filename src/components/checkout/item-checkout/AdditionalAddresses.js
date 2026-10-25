import React, { useEffect, useState } from "react";

import {
	Checkbox,
	FormControlLabel,
	FormGroup,
	Grid,
	Typography,
} from "@mui/material";

import {
	CustomStackFullWidth,
	CustomTextField,
} from "../../../styled-components/CustomStyles.style";
import { useTheme } from "@emotion/react";
import { ACTIONS } from "../../address/states";

const AdditionalAddresses = (props) => {
	const {
		t,
		additionalInformationStates,
		additionalInformationDispatch,
		saveAddress,
		address,
		setAddress,
		orderType,
	} = props;
	const [block, setBlock] = useState(
		additionalInformationStates?.block || address?.block || ""
	);
	const [street, setStreet] = useState(
		additionalInformationStates?.streetNumber || address?.road || ""
	);
	const [house, setHouse] = useState(
		additionalInformationStates?.houseNumber || address?.house || ""
	);
	const [floor, setFloor] = useState(
		additionalInformationStates?.floor || address?.floor || ""
	);

	useEffect(() => {
		setBlock(address?.block || "");
		setStreet(address?.road || "");
		setHouse(address?.house || "");
		setFloor(address?.floor || "");
	}, [address?.block, address?.house, address?.road, address?.floor]);

	const handleBlockChange = (e) => {
		setBlock(e.target.value);
		additionalInformationDispatch({
			type: ACTIONS.setBlock,
			payload: e.target.value,
		});
	};
	const handleStreetChange = (e) => {
		setStreet(e.target.value);
		additionalInformationDispatch({
			type: ACTIONS.setStreetNumber,
			payload: e.target.value,
		});
	};
	const handleHouseChange = (e) => {
		setHouse(e.target.value);
		additionalInformationDispatch({
			type: ACTIONS.setHouseNumber,
			payload: e.target.value,
		});
	};
	const handleFloorChange = (e) => {
		setFloor(e.target.value);
		additionalInformationDispatch({
			type: ACTIONS.setFloor,
			payload: e.target.value,
		});
	};

	const theme = useTheme();
	const handleSave = (e) => {
		if (e.target.checked) {
			saveAddress();
		}
	};
	useEffect(() => {
		if (orderType !== "take_away") {
			setAddress({ ...address, block, road: street, house, floor });
		}
	}, [block, street, house, floor]);

	return (
		<CustomStackFullWidth>
			<CustomStackFullWidth>
				<FormGroup>
					<Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
						<Grid item xs={6}>
							<CustomTextField
								required="true"
								label={t("Block / Avenue")}
								value={block}
								fullWidth
								onChange={(e) => handleBlockChange(e)}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								required="true"
								label={t("Street / Road")}
								value={street}
								fullWidth
								onChange={(e) => handleStreetChange(e)}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								required="true"
								label={t("Building / House")}
								value={house}
								fullWidth
								onChange={(e) => handleHouseChange(e)}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								required="true"
								label={t("Floor / Apartment")}
								value={floor}
								fullWidth
								onChange={(e) => handleFloorChange(e)}
							/>
						</Grid>
					</Grid>
					<FormControlLabel
						onChange={(e) => handleSave(e)}
						control={<Checkbox />}
						label={
							<Typography
								fontWeight="400"
								fontSize="13px"
								color={theme.palette.primary.main}
							>
								{t("Save this Address")}
							</Typography>
						}
					/>
				</FormGroup>
			</CustomStackFullWidth>
		</CustomStackFullWidth>
	);
};

AdditionalAddresses.propTypes = {};

export default AdditionalAddresses;
