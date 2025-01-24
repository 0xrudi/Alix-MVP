import { useBreakpointValue } from "@chakra-ui/react";

export const useResponsive = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "xl", md: "2xl" });
  const showFullText = useBreakpointValue({ base: false, md: true });
  const gridColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4, xl: 5 });

  return {
    isMobile,
    buttonSize,
    headingSize,
    showFullText,
    gridColumns
  };
};