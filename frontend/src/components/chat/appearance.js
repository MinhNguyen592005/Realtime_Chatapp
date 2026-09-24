export const DEFAULT_CHAT_APPEARANCE = {
  messageColor: "#FEDBD0",
  backgroundColor: "#FFFFFF",
};

export const isHexColor = (value) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export const getReadableTextColor = (backgroundColor) => {
  const color = isHexColor(backgroundColor)
    ? backgroundColor
    : DEFAULT_CHAT_APPEARANCE.backgroundColor;
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(color.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;

  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#0f172a"
    : "#ffffff";
};
