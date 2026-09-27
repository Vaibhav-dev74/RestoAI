import { extendTheme } from '@chakra-ui/react';

const premiumTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },
  colors: {
    brand: {
      beige: '#FAFAF8',
      ink: '#111111',
      muted: '#6B6B6B',
    },
    terracotta: {
      500: '#C07C4A',
      600: '#B36F43',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'brand.beige',
        color: 'brand.ink',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'blackAlpha.100',
          borderRadius: '14px',
          boxShadow: 'sm',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '150ms',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: '12px',
        fontWeight: 600,
        transitionProperty: 'transform, box-shadow, background, border-color',
        transitionDuration: '150ms',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _active: {
          transform: 'translateY(0px)',
          boxShadow: 'sm',
        },
      },
      variants: {
        dark: {
          bg: 'brand.ink',
          color: 'white',
          _hover: {
            bg: '#1A1A1A',
          },
        },
        terracotta: {
          bg: 'terracotta.500',
          color: 'white',
          _hover: {
            bg: 'terracotta.600',
          },
        },
        softOutline: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'blackAlpha.200',
          color: 'brand.ink',
          _hover: {
            bg: 'blackAlpha.50',
            borderColor: 'blackAlpha.300',
          },
        },
        pill: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'blackAlpha.200',
          color: 'brand.ink',
          borderRadius: '999px',
          px: 4,
          _hover: {
            bg: 'blackAlpha.50',
            borderColor: 'blackAlpha.300',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: '12px',
            borderColor: 'blackAlpha.200',
            _hover: { borderColor: 'blackAlpha.300' },
            _focusVisible: {
              borderColor: 'blackAlpha.500',
              boxShadow: '0 0 0 1px rgba(17, 17, 17, 0.35)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
  },
});

export default premiumTheme;
