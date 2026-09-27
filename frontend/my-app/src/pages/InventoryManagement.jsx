import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import React from 'react';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  ChakraProvider, extendTheme, Box, Flex, Grid, GridItem,
  Text, Button, Input, Select, IconButton, Badge,
  VStack, HStack, Divider, Spinner, Tooltip, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton, useDisclosure,
  NumberInput, NumberInputField, InputGroup, InputRightElement,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, Tag, TagLabel, FormControl, FormLabel,
  Progress, Stat, StatLabel, StatNumber, StatHelpText,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Package, Mic, MicOff, Layers,
  Search, Edit3, Trash2, CheckCircle, AlertTriangle,
  TrendingUp, X, ChevronDown, RefreshCw, Filter,
  BarChart2, Zap, Clock,
} from 'lucide-react';

// ─── THEME ───────────────────────────────────────────────────────────────────
// Fonts: Inter (UI) + Space Grotesk (headings) + Fira Code (data/mono)
const theme = extendTheme({
  fonts: {
    heading: `'Space Grotesk', 'Helvetica Neue', sans-serif`,
    body:    `'Inter', 'system-ui', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: '#F8F9FC',
        color: '#1A202C',
        fontFamily: `'Inter', sans-serif`,
        margin: 0, padding: 0,
      },
      '::selection': { bg: '#6366F1', color: '#FFFFFF' },
      '*': { boxSizing: 'border-box' },
      '::-webkit-scrollbar': { width: '8px', height: '8px' },
      '::-webkit-scrollbar-track': { bg: '#F1F5F9' },
      '::-webkit-scrollbar-thumb': { bg: '#CBD5E1', borderRadius: '4px' },
      '::-webkit-scrollbar-thumb:hover': { bg: '#94A3B8' },
    },
  },
});

const MB = motion(Box);
const MF = motion(Flex);

// ─── COLOR TOKENS ────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:       '#F8F9FC',      // Main background
  surface:  '#FFFFFF',      // Card/panel background
  surfaceHover: '#F8FAFC',  // Hover state
  border:   '#E2E8F0',      // Default borders
  borderHi: '#CBD5E1',      // Emphasized borders
  
  // Primary colors (Indigo)
  primary:     '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryBg:   '#EEF2FF',
  
  // Text colors
  text:      '#1A202C',     // Primary text
  textMuted: '#64748B',     // Secondary text
  textLight: '#94A3B8',     // Tertiary text
  
  // Semantic colors
  success:      '#10B981',
  successLight: '#34D399',
  successBg:    '#D1FAE5',
  
  warning:      '#F59E0B',
  warningLight: '#FBBF24',
  warningBg:    '#FEF3C7',
  
  danger:       '#EF4444',
  dangerLight:  '#F87171',
  dangerBg:     '#FEE2E2',
  
  info:         '#3B82F6',
  infoBg:       '#DBEAFE',
  
  // Accent colors
  purple:       '#8B5CF6',
  purpleBg:     '#EDE9FE',
  teal:         '#14B8A6',
  tealBg:       '#CCFBF1',
  pink:         '#EC4899',
  pinkBg:       '#FCE7F3',
};

const ease = [0.4, 0, 0.2, 1];

// ─── UNIT CONFIG ─────────────────────────────────────────────────────────────
const UNITS = ['pieces', 'kg', 'liters', 'gms', 'ml', 'packs'];
const UNIT_COLORS = {
  kg:      { bg: T.successBg,  text: T.success },
  liters:  { bg: T.infoBg,     text: T.info },
  gms:     { bg: T.warningBg,  text: T.warning },
  ml:      { bg: T.purpleBg,   text: T.purple },
  pieces:  { bg: '#F1F5F9',    text: T.textMuted },
  packs:   { bg: T.tealBg,     text: T.teal },
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Ic, accent, delay = 0 }) {
  return (
    <MB
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      bg={T.surface} 
      border={`1px solid ${T.border}`}
      borderRadius="12px"
      p="20px" 
      flex="1" 
      minW="180px"
      position="relative" 
      overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
      _hover={{ 
        borderColor: accent, 
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transform: "translateY(-2px)",
        transition: "all 0.2s ease"
      }}
    >
      <Box
        position="absolute" 
        top="-30px" 
        right="-30px"
        w="100px" 
        h="100px" 
        borderRadius="full"
        bg={accent} 
        opacity="0.06"
      />
      <Flex align="center" gap="10px" mb="16px">
        <Box
          w="40px" 
          h="40px" 
          borderRadius="10px"
          bg={`${accent}15`}
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <Ic size={20} color={accent} strokeWidth={2} />
        </Box>
        <Text 
          fontFamily="'Fira Code', monospace" 
          fontSize="11px" 
          fontWeight="500"
          letterSpacing="0.05em" 
          textTransform="uppercase" 
          color={T.textLight}
        >
          {label}
        </Text>
      </Flex>
      <Text 
        fontFamily="'Space Grotesk', sans-serif" 
        fontSize="32px" 
        fontWeight="600" 
        color={T.text} 
        lineHeight="1"
        mb="8px"
      >
        {value}
      </Text>
      {sub && (
        <Text 
          fontFamily="'Inter', sans-serif" 
          fontSize="13px" 
          color={T.textMuted}
          fontWeight="400"
        >
          {sub}
        </Text>
      )}
    </MB>
  );
}

// ─── UNIT BADGE ──────────────────────────────────────────────────────────────
function UnitBadge({ unit }) {
  const style = UNIT_COLORS[unit] || UNIT_COLORS.pieces;
  return (
    <Box
      display="inline-flex" 
      alignItems="center"
      bg={style.bg} 
      px="10px" 
      py="4px"
      borderRadius="6px"
      fontFamily="'Fira Code', monospace"
      fontSize="11px" 
      fontWeight="500"
      letterSpacing="0.02em" 
      textTransform="lowercase"
      color={style.text}
    >
      {unit}
    </Box>
  );
}

// ─── STOCK LEVEL BAR ─────────────────────────────────────────────────────────
function StockBar({ qty, max = 500 }) {
  const pct = Math.min((qty / max) * 100, 100);
  const color = pct < 20 ? T.danger : pct < 40 ? T.warning : T.success;
  return (
    <Box w="100px" h="6px" bg={T.border} borderRadius="3px" overflow="hidden">
      <Box 
        w={`${pct}%`} 
        h="100%" 
        bg={color} 
        borderRadius="3px"
        transition="width 0.5s ease" 
      />
    </Box>
  );
}

// ─── VOICE PANEL ─────────────────────────────────────────────────────────────
function VoicePanel({ isListening, voiceText, setVoiceText, useTextInput, setUseTextInput,
  onStart, onStop, onProcess, onClose, lang, setLang }) {
  return (
    <MB
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} 
      transition={{ duration: 0.3, ease }}
      bg={T.surface} 
      border={`1px solid ${T.border}`} 
      borderRadius="12px"
      mb="20px" 
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
    >
      {/* Header */}
      <Flex
        align="center" 
        justify="space-between"
        px="24px" 
        py="16px" 
        borderBottom={`1px solid ${T.border}`}
        bg={T.bg}
      >
        <Flex align="center" gap="12px">
          <Box
            w="10px" 
            h="10px" 
            borderRadius="full" 
            bg={isListening ? T.danger : T.textLight}
            style={isListening ? { animation: 'pulse-dot 1.2s ease-in-out infinite' } : {}}
          />
          <Text 
            fontFamily="'Fira Code', monospace" 
            fontSize="12px" 
            fontWeight="500"
            letterSpacing="0.03em" 
            textTransform="uppercase" 
            color={T.textMuted}
          >
            {useTextInput ? 'Text Input Mode' : isListening ? 'Listening...' : 'Voice Input Mode'}
          </Text>
        </Flex>
        <Flex align="center" gap="10px">
          <Select
            size="sm" 
            value={lang} 
            onChange={e => setLang(e.target.value)}
            bg={T.surface} 
            border={`1px solid ${T.border}`} 
            borderRadius="8px"
            color={T.textMuted} 
            fontSize="12px" 
            w="90px"
            fontWeight="500"
            _focus={{ borderColor: T.primary, boxShadow: `0 0 0 1px ${T.primary}` }}
          >
            <option value="en-US">English</option>
            <option value="hi-IN">हिंदी</option>
          </Select>
          <Box
            as="button"
            onClick={() => setUseTextInput(!useTextInput)}
            px="12px" 
            py="6px"
            borderRadius="8px"
            bg={useTextInput ? T.successBg : T.primaryBg}
            border={`1px solid ${useTextInput ? T.success : T.primary}`}
            fontFamily="'Fira Code', monospace" 
            fontSize="11px"
            fontWeight="600"
            letterSpacing="0.02em" 
            textTransform="uppercase"
            color={useTextInput ? T.success : T.primary} 
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          >
            {useTextInput ? '🎤 Voice' : '⌨️ Text'}
          </Box>
          <IconButton
            icon={<X size={16} />} 
            variant="ghost" 
            size="sm"
            color={T.textMuted} 
            _hover={{ color: T.text, bg: T.bg }} 
            onClick={onClose}
            aria-label="close"
            borderRadius="8px"
          />
        </Flex>
      </Flex>

      {/* Body */}
      <Box px="24px" py="20px">
        <Flex 
          align="center" 
          gap="8px"
          mb="14px" 
          p="12px"
          bg={T.primaryBg}
          borderRadius="8px"
          border={`1px solid ${T.primary}25`}
        >
          <Box fontSize="16px">💡</Box>
          <Text fontSize="13px" color={T.textMuted} lineHeight="1.6" fontWeight="400">
            Example: <Text as="span" color={T.primary} fontWeight="600">"50 kg tomatoes, 100 pieces bread, 5 liters oil"</Text>
          </Text>
        </Flex>

        {useTextInput ? (
          <Box
            as="textarea"
            value={voiceText}
            onChange={e => setVoiceText(e.target.value)}
            placeholder="Type items: 50 kg tomatoes, 100 pieces bread..."
            bg={T.bg} 
            border={`2px solid ${T.border}`}
            borderRadius="10px" 
            p="14px" 
            w="100%" 
            minH="100px"
            color={T.text} 
            fontSize="14px" 
            resize="vertical"
            fontFamily="'Fira Code', monospace"
            _focus={{ 
              outline: "none", 
              borderColor: T.primary,
              boxShadow: `0 0 0 3px ${T.primaryBg}`
            }}
            _placeholder={{ color: T.textLight }}
            style={{ display: 'block' }}
          />
        ) : (
          <Box
            bg={T.bg} 
            border={`2px solid ${isListening ? T.primary : T.border}`}
            borderRadius="10px"
            p="16px" 
            minH="100px"
            fontFamily="'Fira Code', monospace" 
            fontSize="14px"
            color={voiceText ? T.text : T.textLight}
            display="flex"
            alignItems="center"
            transition="border-color 0.3s ease"
          >
            {voiceText || '🎤 Waiting for voice input...'}
          </Box>
        )}

        <Flex gap="10px" mt="16px" flexWrap="wrap">
          {!useTextInput && (
            <Box
              as="button" 
              onClick={isListening ? onStop : onStart}
              display="flex" 
              alignItems="center" 
              gap="8px"
              bg={isListening ? T.dangerBg : T.primaryBg}
              border={`2px solid ${isListening ? T.danger : T.primary}`}
              borderRadius="10px"
              px="18px" 
              py="10px" 
              cursor="pointer"
              fontFamily="'Inter', sans-serif" 
              fontSize="13px"
              fontWeight="600"
              letterSpacing="0.01em"
              color={isListening ? T.danger : T.primary}
              _hover={{ opacity: 0.85 }}
              transition="all 0.2s ease"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening ? 'Stop Recording' : 'Start Recording'}
            </Box>
          )}
          <Box
            as="button" 
            onClick={onProcess}
            opacity={voiceText.trim() ? 1 : 0.4}
            pointerEvents={voiceText.trim() ? 'auto' : 'none'}
            display="flex" 
            alignItems="center" 
            gap="8px"
            bg={T.success}
            borderRadius="10px"
            px="18px" 
            py="10px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="13px"
            fontWeight="600"
            color="#FFFFFF"
            _hover={{ bg: T.successLight }}
            transition="all 0.2s ease"
          >
            <CheckCircle size={16} /> Process Items
          </Box>
          <Box
            as="button" 
            onClick={() => setVoiceText('')}
            display="flex" 
            alignItems="center" 
            gap="8px"
            bg={T.surface} 
            border={`2px solid ${T.border}`}
            borderRadius="10px"
            px="18px" 
            py="10px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="13px"
            fontWeight="600"
            color={T.textMuted} 
            _hover={{ color: T.text, borderColor: T.borderHi }}
            transition="all 0.2s ease"
          >
            <X size={16} /> Clear
          </Box>
        </Flex>
      </Box>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </MB>
  );
}

// ─── ITEM FORM ───────────────────────────────────────────────────────────────
function ItemForm({ data, onChange, onSubmit, onCancel, isEditing }) {
  return (
    <MB
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} 
      transition={{ duration: 0.3, ease }}
      bg={T.surface} 
      border={`1px solid ${T.border}`}
      borderRadius="12px"
      mb="20px" 
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
    >
      <Flex 
        align="center" 
        justify="space-between" 
        px="24px" 
        py="16px" 
        borderBottom={`1px solid ${T.border}`}
        bg={T.bg}
      >
        <Flex align="center" gap="12px">
          <Box w="3px" h="20px" bg={T.primary} borderRadius="2px" />
          <Text 
            fontFamily="'Space Grotesk', sans-serif" 
            fontSize="16px" 
            fontWeight="600"
            color={T.text}
          >
            {isEditing ? 'Edit Inventory Item' : 'Add New Item'}
          </Text>
        </Flex>
        <IconButton 
          icon={<X size={16} />} 
          variant="ghost" 
          size="sm" 
          color={T.textMuted} 
          _hover={{ color: T.text, bg: T.bg }} 
          onClick={onCancel} 
          borderRadius="8px"
          aria-label="close" 
        />
      </Flex>
      <Box px="24px" py="20px" as="form" onSubmit={onSubmit}>
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap="16px" mb="20px">
          <Box>
            <Text 
              fontFamily="'Inter', sans-serif" 
              fontSize="13px" 
              fontWeight="600"
              color={T.text} 
              mb="8px"
            >
              Item Name <Text as="span" color={T.danger}>*</Text>
            </Text>
            <Input
              name="name" 
              value={data.name} 
              onChange={onChange} 
              required
              placeholder="e.g., Chicken Breast"
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="10px"
              color={T.text} 
              fontSize="14px" 
              h="44px"
              _focus={{ borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryBg}` }}
              _placeholder={{ color: T.textLight }}
            />
          </Box>
          <Box>
            <Text 
              fontFamily="'Inter', sans-serif" 
              fontSize="13px" 
              fontWeight="600"
              color={T.text} 
              mb="8px"
            >
              Quantity <Text as="span" color={T.danger}>*</Text>
            </Text>
            <Input
              name="quantity" 
              value={data.quantity} 
              onChange={onChange}
              type="number" 
              min="0" 
              step="0.01" 
              required 
              placeholder="0"
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="10px"
              color={T.text} 
              fontSize="14px" 
              h="44px"
              fontFamily="'Fira Code', monospace"
              _focus={{ borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryBg}` }}
              _placeholder={{ color: T.textLight }}
            />
          </Box>
          <Box>
            <Text 
              fontFamily="'Inter', sans-serif" 
              fontSize="13px" 
              fontWeight="600"
              color={T.text} 
              mb="8px"
            >
              Unit
            </Text>
            <Select
              name="unit" 
              value={data.unit} 
              onChange={onChange}
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="10px"
              color={T.text} 
              fontSize="14px" 
              h="44px"
              fontWeight="500"
              _focus={{ borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryBg}` }}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Box>
        </Grid>
        <Flex gap="10px">
          <Box
            as="button" 
            type="submit"
            display="flex" 
            alignItems="center" 
            gap="8px"
            bg={T.primary} 
            color="#FFFFFF"
            borderRadius="10px"
            px="20px" 
            py="11px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="14px"
            fontWeight="600"
            _hover={{ bg: T.primaryDark }}
            transition="all 0.2s ease"
          >
            <CheckCircle size={16} /> {isEditing ? 'Update Item' : 'Add to Inventory'}
          </Box>
          <Box
            as="button" 
            type="button" 
            onClick={onCancel}
            display="flex" 
            alignItems="center" 
            gap="8px"
            bg={T.surface} 
            border={`2px solid ${T.border}`}
            borderRadius="10px"
            px="20px" 
            py="11px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="14px"
            fontWeight="600"
            color={T.textMuted} 
            _hover={{ color: T.text, borderColor: T.borderHi }}
            transition="all 0.2s ease"
          >
            Cancel
          </Box>
        </Flex>
      </Box>
    </MB>
  );
}

// ─── BULK FORM ───────────────────────────────────────────────────────────────
function BulkForm({ items, onChange, onAdd, onRemove, onSubmit, onCancel, onVoiceAdd }) {
  const validCount = items.filter(i => i.name.trim() && Number(i.quantity) > 0).length;
  return (
    <MB
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} 
      transition={{ duration: 0.3, ease }}
      bg={T.surface} 
      border={`1px solid ${T.border}`}
      borderRadius="12px"
      mb="20px" 
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
    >
      <Flex 
        align="center" 
        justify="space-between" 
        px="24px" 
        py="16px" 
        borderBottom={`1px solid ${T.border}`}
        bg={T.bg}
      >
        <Flex align="center" gap="12px">
          <Box w="3px" h="20px" bg={T.warning} borderRadius="2px" />
          <Text 
            fontFamily="'Space Grotesk', sans-serif" 
            fontSize="16px" 
            fontWeight="600"
            color={T.text}
          >
            Bulk Import — {items.length} row{items.length !== 1 ? 's' : ''}
          </Text>
        </Flex>
        <Flex gap="10px">
          <Box
            as="button" 
            onClick={onVoiceAdd}
            display="flex" 
            alignItems="center" 
            gap="6px"
            bg={T.primaryBg} 
            border={`2px solid ${T.primary}`}
            borderRadius="8px"
            px="12px" 
            py="6px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="12px"
            fontWeight="600"
            color={T.primary}
            _hover={{ bg: T.primary, color: '#FFFFFF' }}
            transition="all 0.2s ease"
          >
            <Mic size={14} /> Add via Voice
          </Box>
          <IconButton 
            icon={<X size={16} />} 
            variant="ghost" 
            size="sm" 
            color={T.textMuted} 
            _hover={{ color: T.text, bg: T.bg }} 
            onClick={onCancel} 
            borderRadius="8px"
            aria-label="close" 
          />
        </Flex>
      </Flex>
      <Box px="24px" py="20px" as="form" onSubmit={onSubmit} maxH="420px" overflowY="auto">
        {/* Column headers */}
        <Grid templateColumns="2fr 1fr 1fr 40px" gap="12px" mb="12px">
          {['Item Name', 'Quantity', 'Unit', ''].map((h, i) => (
            <Text 
              key={i} 
              fontFamily="'Fira Code', monospace" 
              fontSize="11px" 
              fontWeight="600"
              letterSpacing="0.03em" 
              textTransform="uppercase" 
              color={T.textMuted}
            >
              {h}
            </Text>
          ))}
        </Grid>
        {items.map((item, idx) => (
          <Grid key={idx} templateColumns="2fr 1fr 1fr 40px" gap="12px" mb="12px" alignItems="center">
            <Input
              value={item.name} 
              onChange={e => onChange(idx, 'name', e.target.value)}
              placeholder="Item name" 
              required={idx === 0}
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="8px"
              color={T.text} 
              fontSize="13px" 
              h="40px"
              _focus={{ borderColor: T.primary, boxShadow: 'none' }}
              _placeholder={{ color: T.textLight, fontSize: '12px' }}
            />
            <Input
              value={item.quantity} 
              onChange={e => onChange(idx, 'quantity', e.target.value)}
              type="number" 
              min="0" 
              step="0.01" 
              placeholder="0"
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="8px"
              color={T.text} 
              fontSize="13px" 
              h="40px"
              fontFamily="'Fira Code', monospace"
              _focus={{ borderColor: T.primary, boxShadow: 'none' }}
              _placeholder={{ color: T.textLight }}
            />
            <Select
              value={item.unit} 
              onChange={e => onChange(idx, 'unit', e.target.value)}
              bg={T.bg} 
              border={`2px solid ${T.border}`} 
              borderRadius="8px"
              color={T.text} 
              fontSize="12px" 
              h="40px"
              fontWeight="500"
              _focus={{ borderColor: T.primary, boxShadow: 'none' }}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
            <Flex align="center" justify="center">
              {items.length > 1 && (
                <Box
                  as="button" 
                  type="button" 
                  onClick={() => onRemove(idx)}
                  w="32px" 
                  h="32px" 
                  borderRadius="8px"
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  color={T.textMuted} 
                  _hover={{ color: T.danger, bg: T.dangerBg }} 
                  cursor="pointer"
                  transition="all 0.2s ease"
                >
                  <X size={16} />
                </Box>
              )}
            </Flex>
          </Grid>
        ))}
        <Box
          as="button" 
          type="button" 
          onClick={onAdd}
          display="flex" 
          alignItems="center" 
          gap="8px"
          bg="transparent" 
          border={`2px dashed ${T.border}`}
          borderRadius="10px"
          w="100%" 
          py="12px" 
          mt="8px" 
          cursor="pointer" 
          justifyContent="center"
          fontFamily="'Inter', sans-serif" 
          fontSize="13px"
          fontWeight="600"
          color={T.textMuted} 
          _hover={{ borderColor: T.primary, color: T.primary, bg: T.primaryBg }}
          mb="20px"
          transition="all 0.2s ease"
        >
          <Plus size={16} /> Add Another Row
        </Box>
        <Flex gap="10px">
          <Box
            as="button" 
            type="submit"
            opacity={validCount > 0 ? 1 : 0.4}
            pointerEvents={validCount > 0 ? 'auto' : 'none'}
            display="flex" 
            alignItems="center" 
            gap="8px"
            bg={T.warning}
            color="#FFFFFF"
            borderRadius="10px"
            px="20px" 
            py="11px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="14px"
            fontWeight="600"
            _hover={{ bg: T.warningLight }}
            transition="all 0.2s ease"
          >
            <Layers size={16} /> Import {validCount} Item{validCount !== 1 ? 's' : ''}
          </Box>
          <Box
            as="button" 
            type="button" 
            onClick={onCancel}
            bg={T.surface} 
            border={`2px solid ${T.border}`}
            borderRadius="10px"
            px="20px" 
            py="11px" 
            cursor="pointer"
            fontFamily="'Inter', sans-serif" 
            fontSize="14px"
            fontWeight="600"
            color={T.textMuted} 
            _hover={{ color: T.text, borderColor: T.borderHi }}
            transition="all 0.2s ease"
          >
            Cancel
          </Box>
        </Flex>
      </Box>
    </MB>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function InventoryManagement({ highlightedItem: highlightedItems, refreshKey }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [useTextInput, setUseTextInput] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [addingToBulk, setAddingToBulk] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const navigate = useNavigate();
  const toast = useToast();
  const VITE_API_URL = API_BASE_URL;

  const [formData, setFormData] = useState({ name: '', quantity: '', unit: 'pieces' });
  const [bulkItems, setBulkItems] = useState([{ name: '', quantity: '', unit: 'pieces' }]);

  useEffect(() => { getInventory(); fetchUserRole(); }, [refreshKey]);

  // Voice recognition init
  useEffect(() => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new SR();
        r.continuous = true;
        r.interimResults = true;
        r.lang = voiceLang;
        r.onstart = () => { setIsListening(true); setVoiceText(''); };
        r.onresult = e => {
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; i++)
            if (e.results[i].isFinal) final += e.results[i][0].transcript;
          if (final) setVoiceText(p => p + final + ' ');
        };
        r.onerror = e => { setIsListening(false); setUseTextInput(true); };
        r.onend = () => setIsListening(false);
        setRecognition(r);
      } else {
        setUseTextInput(true);
      }
    } catch { setUseTextInput(true); }
  }, [voiceLang]);

  const startListening = () => { try { recognition?.start(); } catch {} };
  const stopListening  = () => { try { recognition?.stop();  } catch {} };

  const normalizeUnit = u => ({
    kg:'kg', kilos:'kg', kilogram:'kg', kilograms:'kg',
    pieces:'pieces', piece:'pieces', pcs:'pieces', pc:'pieces', units:'pieces', unit:'pieces',
    liters:'liters', liter:'liters', l:'liters', litres:'liters', litre:'liters',
    grams:'gms', gram:'gms', gms:'gms', gm:'gms', g:'gms',
    packs:'packs', pack:'packs', packets:'packs', packet:'packs',
    ml:'ml', milliliters:'ml', milliliter:'ml',
  })[u?.toLowerCase()] || 'pieces';

  const parseVoice = text => {
    const items = [];
    const pat = /(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?|pieces?|pcs?|units?|l|liters?|litres?|grams?|gms?|ml|milliliters?|packs?|packets?)\s+([a-zA-Z\s]+?)(?=\s+\d+\s|\s*[,.]|$)/gi;
    let m;
    while ((m = pat.exec(text)) !== null) {
      const name = m[3].trim();
      if (name) items.push({ name: name[0].toUpperCase() + name.slice(1), quantity: m[1], unit: normalizeUnit(m[2]) });
    }
    if (!items.length) {
      const basic = /(\d+)\s+(.+)/;
      const bm = text.match(basic);
      if (bm) items.push({ name: bm[2].trim(), quantity: bm[1], unit: 'pieces' });
    }
    return items;
  };

  const processVoice = () => {
    if (!voiceText.trim()) { showToast('No input detected', 'warning'); return; }
    const items = parseVoice(voiceText);
    if (!items.length) { showToast('Could not parse items — try: "50 kg tomatoes, 100 pieces bread"', 'error'); return; }
    if (addingToBulk) {
      setBulkItems(p => [...p, ...items]);
      setShowBulkForm(true);
      setAddingToBulk(false);
    } else {
      setBulkItems(items);
      setShowBulkForm(true);
    }
    setVoiceText('');
    setShowVoice(false);
    showToast(`Parsed ${items.length} item${items.length > 1 ? 's' : ''}`, 'success');
  };

  const showToast = (msg, status) => toast({
    description: msg, 
    status, 
    duration: 3500, 
    isClosable: true,
    position: 'bottom-right',
    containerStyle: { 
      fontFamily: "'Inter', sans-serif", 
      fontSize: '14px',
      fontWeight: '500',
    },
  });

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${VITE_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUserRole(res.data.user?.role || '');
    } catch {}
  };

  const getInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${VITE_API_URL}/api/orders/inventory`, { headers: { Authorization: `Bearer ${token}` } });
      setInventory(res.data);
    } catch { setError('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem) {
        await axios.put(`${VITE_API_URL}/api/orders/inventory/${editingItem._id}`, formData, { headers });
        showToast('Item updated successfully', 'success');
      } else {
        await axios.post(`${VITE_API_URL}/api/orders/createin`, formData, { headers });
        showToast('Item added to inventory', 'success');
      }
      setFormData({ name: '', quantity: '', unit: 'pieces' });
      setShowAddForm(false); setEditingItem(null);
      getInventory();
    } catch { showToast('Failed to save item', 'error'); }
  };

  const handleBulkSubmit = async e => {
    e.preventDefault();
    const valid = bulkItems.filter(i => i.name.trim() && Number(i.quantity) > 0);
    if (!valid.length) { showToast('Add at least one valid item', 'warning'); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${VITE_API_URL}/api/orders/createinbulk`, valid, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Successfully imported ${valid.length} items`, 'success');
      setBulkItems([{ name: '', quantity: '', unit: 'pieces' }]);
      setShowBulkForm(false);
      getInventory();
    } catch { showToast('Bulk import failed', 'error'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${VITE_API_URL}/api/orders/inventory/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Item deleted successfully', 'success');
      getInventory();
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleEdit = item => {
    setEditingItem(item);
    setFormData({ name: item.name, quantity: item.quantity.toString(), unit: item.unit });
    setShowAddForm(true);
    setShowBulkForm(false);
  };

  const handleBack = () => {
    const routes = { vendor: '/vendor/dashboard', manager: '/manager/dashboard' };
    navigate(routes[userRole] || '/');
  };

  const matchHL = (name, hl) => {
    if (!name || !hl?.length) return false;
    const n = name.trim().toLowerCase();
    return hl.some(h => { const hL = h?.trim().toLowerCase(); return n===hL||n===hL+'s'||n+'s'===hL||n.includes(hL)||hL.includes(n); });
  };

  // Derived list
  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchUnit   = filterUnit === 'all' || item.unit === filterUnit;
    return matchSearch && matchUnit;
  });

  const lowStock = inventory.filter(i => Number(i.quantity) < 20).length;
  const totalItems = inventory.length;

  if (loading) return (
    <ChakraProvider theme={theme}>
      <Flex minH="100vh" bg={T.bg} align="center" justify="center" direction="column" gap="20px">
        <Box 
          w="50px" 
          h="50px" 
          border={`3px solid ${T.border}`} 
          borderTop={`3px solid ${T.primary}`} 
          borderRadius="full" 
          style={{ animation: 'spin 0.7s linear infinite' }} 
        />
        <Text 
          fontFamily="'Space Grotesk', sans-serif" 
          fontSize="16px" 
          fontWeight="600"
          color={T.textMuted}
        >
          Loading Inventory...
        </Text>
        <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      </Flex>
    </ChakraProvider>
  );

  return (
    <ChakraProvider theme={theme}>
      {/* Font imports */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet" />

      <Box minH="100vh" bg={T.bg} position="relative">
        {/* Subtle background pattern */}
        <Box
          position="fixed" 
          inset="0" 
          pointerEvents="none" 
          opacity="0.4"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${T.border} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top accent line */}
        <Box h="3px" bg={`linear-gradient(90deg, ${T.primary}, ${T.purple}, ${T.teal})`} />

        {/* ── PAGE HEADER ── */}
        <Box
          px={{ base: '20px', md: '48px' }}
          pt="32px" 
          pb="28px"
          borderBottom={`2px solid ${T.border}`}
          position="relative" 
          zIndex={10}
          bg={T.surface}
        >
          <Flex align="center" justify="space-between" flexWrap="wrap" gap="20px">
            {/* Left: back + title */}
            <Flex align="center" gap="24px">
              <Box
                as="button" 
                onClick={handleBack}
                display="flex" 
                alignItems="center" 
                gap="8px"
                color={T.textMuted} 
                _hover={{ color: T.primary }}
                fontFamily="'Inter', sans-serif" 
                fontSize="14px"
                fontWeight="600"
                cursor="pointer" 
                bg="transparent" 
                border="none"
                transition="color 0.2s ease"
              >
                <ArrowLeft size={18} />
                <Text display={{ base: 'none', sm: 'block' }}>Back to Dashboard</Text>
              </Box>
              <Box w="2px" h="28px" bg={T.border} display={{ base: 'none', sm: 'block' }} />
              <Box>
                <Flex align="center" gap="10px" mb="6px">
                  <Box w="28px" h="2px" bg={T.primary} borderRadius="1px" />
                  <Text 
                    fontFamily="'Fira Code', monospace" 
                    fontSize="11px" 
                    fontWeight="600"
                    letterSpacing="0.08em" 
                    textTransform="uppercase" 
                    color={T.primary}
                  >
                    Inventory System
                  </Text>
                </Flex>
                <Text 
                  fontFamily="'Space Grotesk', sans-serif" 
                  fontSize={{ base: '32px', md: '40px' }} 
                  fontWeight="700" 
                  letterSpacing="-0.02em" 
                  color={T.text} 
                  lineHeight="1"
                >
                  Stock Management
                </Text>
              </Box>
            </Flex>

            {/* Right: action buttons */}
            <Flex gap="10px" flexWrap="wrap">
              <Box
                as="button" 
                onClick={() => setShowVoice(p => !p)}
                display="flex" 
                alignItems="center" 
                gap="8px"
                bg={showVoice ? T.primaryBg : T.surface}
                border={`2px solid ${showVoice ? T.primary : T.border}`}
                borderRadius="10px"
                px="16px" 
                py="10px" 
                cursor="pointer"
                fontFamily="'Inter', sans-serif" 
                fontSize="13px"
                fontWeight="600"
                color={showVoice ? T.primary : T.textMuted}
                _hover={{ borderColor: T.primary, color: T.primary }}
                transition="all 0.2s ease"
              >
                <Mic size={16} /> Voice Input
              </Box>
              <Box
                as="button" 
                onClick={() => { setShowBulkForm(p => !p); setShowAddForm(false); }}
                display="flex" 
                alignItems="center" 
                gap="8px"
                bg={showBulkForm ? T.warningBg : T.surface}
                border={`2px solid ${showBulkForm ? T.warning : T.border}`}
                borderRadius="10px"
                px="16px" 
                py="10px" 
                cursor="pointer"
                fontFamily="'Inter', sans-serif" 
                fontSize="13px"
                fontWeight="600"
                color={showBulkForm ? T.warning : T.textMuted}
                _hover={{ borderColor: T.warning, color: T.warning }}
                transition="all 0.2s ease"
              >
                <Layers size={16} /> Bulk Import
              </Box>
              <Box
                as="button"
                onClick={() => { setShowAddForm(p => !p); setShowBulkForm(false); setEditingItem(null); setFormData({ name: '', quantity: '', unit: 'pieces' }); }}
                display="flex" 
                alignItems="center" 
                gap="8px"
                bg={T.primary}
                borderRadius="10px"
                px="18px" 
                py="10px" 
                cursor="pointer"
                fontFamily="'Inter', sans-serif" 
                fontSize="13px"
                fontWeight="600"
                color="#FFFFFF"
                _hover={{ bg: T.primaryDark, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
                transition="all 0.2s ease"
              >
                <Plus size={16} /> Add Item
              </Box>
            </Flex>
          </Flex>
        </Box>

        {/* ── CONTENT ── */}
        <Box px={{ base: '20px', md: '48px' }} py="32px" position="relative" zIndex={5}>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <MB
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                bg={T.dangerBg}
                border={`2px solid ${T.danger}`}
                borderRadius="12px"
                px="20px" 
                py="14px" 
                mb="20px"
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
              >
                <Flex align="center" gap="12px">
                  <AlertTriangle size={20} color={T.danger} />
                  <Text fontSize="14px" color={T.danger} fontFamily="'Inter', sans-serif" fontWeight="500">{error}</Text>
                </Flex>
                <Box 
                  as="button" 
                  onClick={() => setError('')} 
                  color={T.textMuted} 
                  _hover={{ color: T.danger }}
                  cursor="pointer"
                >
                  <X size={18} />
                </Box>
              </MB>
            )}
          </AnimatePresence>

          {/* ── STAT CARDS ── */}
          <Flex gap="16px" mb="32px" flexWrap="wrap">
            <StatCard 
              label="Total Items"  
              value={totalItems}  
              sub="items in stock"         
              icon={Package}    
              accent={T.primary}  
              delay={0}    
            />
            <StatCard 
              label="Low Stock Alerts"    
              value={lowStock}    
              sub="need restocking"   
              icon={AlertTriangle} 
              accent={T.warning} 
              delay={0.08} 
            />
            <StatCard 
              label="Last Updated"  
              value="Live"         
              sub={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              icon={Clock} 
              accent={T.success} 
              delay={0.16} 
            />
            <StatCard 
              label="Categories"  
              value={new Set(inventory.map(i => i.unit)).size} 
              sub="unit types" 
              icon={BarChart2} 
              accent={T.info} 
              delay={0.24} 
            />
          </Flex>

          {/* ── ACTIVE FORMS ── */}
          <AnimatePresence>
            {showVoice && (
              <VoicePanel
                isListening={isListening} 
                voiceText={voiceText} 
                setVoiceText={setVoiceText}
                useTextInput={useTextInput} 
                setUseTextInput={setUseTextInput}
                onStart={startListening} 
                onStop={stopListening} 
                onProcess={processVoice}
                onClose={() => { setShowVoice(false); stopListening(); setAddingToBulk(false); }}
                lang={voiceLang} 
                setLang={setVoiceLang}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAddForm && (
              <ItemForm
                data={formData}
                onChange={e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))}
                onSubmit={handleSubmit}
                onCancel={() => { setShowAddForm(false); setEditingItem(null); setFormData({ name: '', quantity: '', unit: 'pieces' }); }}
                isEditing={!!editingItem}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showBulkForm && (
              <BulkForm
                items={bulkItems}
                onChange={(idx, f, v) => { const u = [...bulkItems]; u[idx] = { ...u[idx], [f]: v }; setBulkItems(u); }}
                onAdd={() => setBulkItems(p => [...p, { name: '', quantity: '', unit: 'pieces' }])}
                onRemove={idx => setBulkItems(p => p.filter((_, i) => i !== idx))}
                onSubmit={handleBulkSubmit}
                onCancel={() => { setShowBulkForm(false); setBulkItems([{ name: '', quantity: '', unit: 'pieces' }]); }}
                onVoiceAdd={() => { setAddingToBulk(true); setShowVoice(true); }}
              />
            )}
          </AnimatePresence>

          {/* ── INVENTORY TABLE ── */}
          <MB 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1, ease }}
          >
            <Box 
              bg={T.surface} 
              border={`2px solid ${T.border}`}
              borderRadius="16px"
              overflow="hidden"
              boxShadow="0 2px 8px rgba(0,0,0,0.04)"
            >
              {/* Table header bar */}
              <Flex
                align="center" 
                justify="space-between"
                px="24px" 
                py="20px"
                borderBottom={`2px solid ${T.border}`}
                bg={T.bg}
                flexWrap="wrap" 
                gap="16px"
              >
                <Flex align="center" gap="14px">
                  <Box w="4px" h="24px" bg={T.primary} borderRadius="2px" />
                  <Text 
                    fontFamily="'Space Grotesk', sans-serif" 
                    fontSize="18px" 
                    fontWeight="600"
                    color={T.text}
                  >
                    Current Stock
                  </Text>
                  <Box
                    px="10px" 
                    py="4px"
                    bg={T.primaryBg} 
                    border={`1px solid ${T.primary}30`}
                    borderRadius="6px"
                    fontFamily="'Fira Code', monospace" 
                    fontSize="12px" 
                    fontWeight="600"
                    color={T.primary}
                  >
                    {filtered.length} items
                  </Box>
                </Flex>
                {/* Search + filter */}
                <Flex gap="10px" flexWrap="wrap">
                  <InputGroup w={{ base: 'full', sm: '240px' }} size="md">
                    <InputRightElement pointerEvents="none" h="44px">
                      <Search size={16} color={T.textLight} />
                    </InputRightElement>
                    <Input
                      placeholder="Search inventory..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      bg={T.bg} 
                      border={`2px solid ${T.border}`} 
                      borderRadius="10px"
                      color={T.text} 
                      fontSize="14px" 
                      h="44px" 
                      pr="40px"
                      _focus={{ borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryBg}` }}
                      _placeholder={{ color: T.textLight }}
                      fontFamily="'Inter', sans-serif"
                    />
                  </InputGroup>
                  <Select
                    value={filterUnit} 
                    onChange={e => setFilterUnit(e.target.value)}
                    bg={T.bg} 
                    border={`2px solid ${T.border}`} 
                    borderRadius="10px"
                    color={T.text} 
                    fontSize="14px" 
                    h="44px" 
                    w={{ base: 'full', sm: '130px' }}
                    fontWeight="500"
                    _focus={{ borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryBg}` }}
                  >
                    <option value="all">All Units</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </Select>
                  <Box
                    as="button" 
                    onClick={getInventory}
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    bg={T.bg} 
                    border={`2px solid ${T.border}`}
                    borderRadius="10px"
                    w="44px"
                    h="44px" 
                    cursor="pointer"
                    color={T.textMuted} 
                    _hover={{ color: T.primary, borderColor: T.primary }}
                    transition="all 0.2s ease"
                  >
                    <RefreshCw size={16} />
                  </Box>
                </Flex>
              </Flex>

              {/* Highlighted items alert */}
              {highlightedItems?.length > 0 && (
                <Flex
                  align="center" 
                  gap="12px"
                  px="24px" 
                  py="12px"
                  bg={T.successBg} 
                  borderBottom={`2px solid ${T.success}30`}
                >
                  <Zap size={16} color={T.success} />
                  <Text 
                    fontFamily="'Inter', sans-serif" 
                    fontSize="13px" 
                    color={T.success} 
                    fontWeight="600"
                  >
                    Highlighting: {highlightedItems.join(', ')}
                  </Text>
                </Flex>
              )}

              {/* Table */}
              {filtered.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py="80px" gap="20px">
                  <Box
                    w="80px"
                    h="80px"
                    borderRadius="full"
                    bg={T.bg}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Package size={40} color={T.textLight} strokeWidth={1.5} />
                  </Box>
                  <Text 
                    fontFamily="'Space Grotesk', sans-serif" 
                    fontSize="24px" 
                    fontWeight="600" 
                    color={T.text}
                  >
                    {search ? 'No items found' : 'No inventory items'}
                  </Text>
                  <Text 
                    fontFamily="'Inter', sans-serif" 
                    fontSize="14px" 
                    color={T.textMuted}
                  >
                    {search ? 'Try adjusting your search terms' : 'Get started by adding your first item'}
                  </Text>
                </Flex>
              ) : (
                <Box overflowX="auto">
                  <Table variant="unstyled" size="md">
                    <Thead>
                      <Tr bg={T.bg}>
                        {['Item Name', 'Quantity', 'Unit', 'Stock Level', 'Last Updated', 'Actions'].map(h => (
                          <Th
                            key={h} 
                            px="24px" 
                            py="16px"
                            fontFamily="'Fira Code', monospace"
                            fontSize="11px" 
                            fontWeight="700"
                            letterSpacing="0.05em"
                            textTransform="uppercase" 
                            color={T.textMuted}
                            borderBottom={`2px solid ${T.border}`}
                          >
                            {h}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filtered.map((item, idx) => {
                        const isHL = matchHL(item.name, highlightedItems);
                        const isLow = Number(item.quantity) < 20;
                        return (
                          <MB
                            key={item._id || idx}
                            as={Tr}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                            bg={isHL ? T.successBg : T.surface}
                            borderBottom={`1px solid ${isHL ? T.success : T.border}30`}
                            _hover={{ bg: isHL ? `${T.successBg}CC` : T.surfaceHover }}
                            style={isHL ? { 
                              boxShadow: `inset 0 0 0 2px ${T.success}40` 
                            } : {}}
                          >
                            <Td px="24px" py="16px">
                              <Flex align="center" gap="12px">
                                {isHL && <Box w="6px" h="6px" borderRadius="full" bg={T.success} />}
                                {isLow && !isHL && (
                                  <Tooltip label="Low stock alert" hasArrow placement="top" bg={T.warning} color="#FFF">
                                    <Box><AlertTriangle size={16} color={T.warning} /></Box>
                                  </Tooltip>
                                )}
                                <Text 
                                  fontSize="15px" 
                                  fontWeight={isHL ? '600' : '500'} 
                                  color={isHL ? T.success : T.text}
                                  fontFamily="'Inter', sans-serif"
                                >
                                  {item.name}
                                </Text>
                              </Flex>
                            </Td>
                            <Td px="24px" py="16px">
                              <Text 
                                fontFamily="'Fira Code', monospace" 
                                fontSize="15px" 
                                fontWeight="600"
                                color={isLow ? T.warning : T.text}
                              >
                                {item.quantity}
                              </Text>
                            </Td>
                            <Td px="24px" py="16px">
                              <UnitBadge unit={item.unit} />
                            </Td>
                            <Td px="24px" py="16px">
                              <Flex align="center" gap="12px">
                                <StockBar qty={Number(item.quantity)} />
                                <Text 
                                  fontFamily="'Fira Code', monospace" 
                                  fontSize="11px" 
                                  fontWeight="500"
                                  color={T.textMuted}
                                >
                                  {Math.min(Math.round((Number(item.quantity) / 500) * 100), 100)}%
                                </Text>
                              </Flex>
                            </Td>
                            <Td px="24px" py="16px">
                              <Text 
                                fontFamily="'Fira Code', monospace" 
                                fontSize="12px" 
                                color={T.textMuted}
                                fontWeight="500"
                              >
                                {new Date(item.lastUpdated).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </Td>
                            <Td px="24px" py="16px">
                              <Flex gap="8px">
                                <Tooltip label="Edit item" hasArrow placement="top" bg={T.text}>
                                  <Box
                                    as="button" 
                                    onClick={() => handleEdit(item)}
                                    w="36px" 
                                    h="36px" 
                                    borderRadius="8px"
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                    bg={T.bg} 
                                    border={`2px solid ${T.border}`}
                                    color={T.textMuted} 
                                    _hover={{ color: T.primary, borderColor: T.primary, bg: T.primaryBg }}
                                    cursor="pointer"
                                    transition="all 0.2s ease"
                                  >
                                    <Edit3 size={15} />
                                  </Box>
                                </Tooltip>
                                <Tooltip label="Delete item" hasArrow placement="top" bg={T.danger}>
                                  <Box
                                    as="button" 
                                    onClick={() => handleDelete(item._id)}
                                    w="36px" 
                                    h="36px" 
                                    borderRadius="8px"
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                    bg={T.bg} 
                                    border={`2px solid ${T.border}`}
                                    color={T.textMuted} 
                                    _hover={{ color: T.danger, borderColor: T.danger, bg: T.dangerBg }}
                                    cursor="pointer"
                                    transition="all 0.2s ease"
                                  >
                                    <Trash2 size={15} />
                                  </Box>
                                </Tooltip>
                              </Flex>
                            </Td>
                          </MB>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* Table footer */}
              {filtered.length > 0 && (
                <Flex
                  align="center" 
                  justify="space-between"
                  px="24px" 
                  py="16px"
                  borderTop={`2px solid ${T.border}`}
                  bg={T.bg}
                  flexWrap="wrap"
                  gap="12px"
                >
                  <Text 
                    fontFamily="'Fira Code', monospace" 
                    fontSize="12px" 
                    color={T.textMuted}
                    fontWeight="500"
                  >
                    Showing {filtered.length} of {inventory.length} items
                    {search && ` · filtered by "${search}"`}
                    {filterUnit !== 'all' && ` · unit: ${filterUnit}`}
                  </Text>
                  {lowStock > 0 && (
                    <Flex align="center" gap="8px">
                      <Box w="8px" h="8px" bg={T.warning} borderRadius="full" />
                      <Text 
                        fontFamily="'Inter', sans-serif" 
                        fontSize="13px" 
                        color={T.warning}
                        fontWeight="600"
                      >
                        {lowStock} item{lowStock > 1 ? 's' : ''} need restocking
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
            </Box>
          </MB>

        </Box>
      </Box>
    </ChakraProvider>
  );
}