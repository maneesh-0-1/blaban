import { useRouter } from "next/router";
import { styled } from "@mui/material";
import NextImage from "components/NextImage";

export const Logo = styled("div")(({ height, width }) => ({
  maxWidth: width,
  height: height,
  position: "relative",
  cursor: "pointer",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
}));

const CustomLogo = ({ logoImg, atlText, height, width, objectFit }) => {
  const router = useRouter();

  const handleClick = (e) => {
    if (e) e.preventDefault();
    router.push("/");
  };

  return (
    <Logo height={height} width={width} onClick={handleClick}>
      <NextImage
        src={logoImg}
        alt={atlText || "logo"}
        objectFit={objectFit ? objectFit : "contain"}
        loading="eager"
        width={100}
        height={70}
      />
    </Logo>
  );
};

export default CustomLogo;
