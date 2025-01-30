import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
      },
      variants: {
        solid: {
          bg: "blue.500",
          color: "white",
          _hover: {
            bg: "blue.600",
          },
        },
      },
    },
    Checkbox: {
      baseStyle: {
        control: {
          borderRadius: "sm",
          _focus: {
            boxShadow: "outline",
          },
        },
      },
    },
    IconButton: {
      baseStyle: {
        borderRadius: "full",
      },
    },
  },
});

export default theme;