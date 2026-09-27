/*
  HomePage.jsx — RestoAI 2026
  ─────────────────────────────────────────────
  Stack  : React + Chakra UI v2 + Framer Motion
  Mode   : Light only (crisp, editorial)
  Fonts  : Playfair Display (display serif)
           Plus Jakarta Sans (UI grotesque)
           JetBrains Mono (data / mono labels)
  Palette:
    canvas   #FAFAF8  warm off-white
    ink      #1A1A18  near-black
    forest   #1B4332  deep green primary
    sage     #52796F  mid green secondary
    terra    #C4622D  terracotta accent
    stone    #F2EDE6  warm surface
    border   #E4DDD4  warm divider
    muted    #7A766E  body secondary
*/

import React, { useEffect, useState, useRef } from 'react'
import {
  ChakraProvider, Box, Flex, Text, Button, Icon,
  HStack, VStack, Grid, GridItem, extendTheme,
  IconButton, Badge, Divider, Image, Tooltip,
} from '@chakra-ui/react'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Brain, TrendingUp, Users, Clock, CheckCircle, Shield,
  ChefHat, Bell, ArrowRight, ArrowUpRight, Menu, X,
  BarChart3, Package, Utensils, Leaf, Target,
  MessageSquare, PieChart, ShoppingCart, Zap,
  TrendingDown, Star, Play, DollarSign, Timer,
  AlertCircle, Coffee, CreditCard, Smartphone,
  Wifi, Bluetooth, ArrowLeftRight,
} from 'lucide-react'

// ─── CHAKRA THEME ─────────────────────────────────────────────────────────────
const theme = extendTheme({
  fonts: {
    heading: `'Playfair Display', Georgia, serif`,
    body:    `'Plus Jakarta Sans', 'Helvetica Neue', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: '#FAFAF8', color: '#1A1A18',
        margin: 0, padding: 0,
        fontFamily: `'Plus Jakarta Sans', sans-serif`,
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      },
      '::selection': { bg: '#1B4332', color: '#FAFAF8' },
      '*': { boxSizing: 'border-box' },
      '::-webkit-scrollbar': { width: '5px' },
      '::-webkit-scrollbar-track': { bg: '#FAFAF8' },
      '::-webkit-scrollbar-thumb': { bg: '#D5CFC6', borderRadius: '4px' },
    },
  },
})

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  canvas:  '#FAFAF8',
  ink:     '#1A1A18',
  forest:  '#1B4332',
  forestL: '#2D6A4F',
  sage:    '#52796F',
  terra:   '#C4622D',
  terraL:  '#E07B45',
  stone:   '#F2EDE6',
  stoneD:  '#E8E0D5',
  border:  '#E4DDD4',
  muted:   '#7A766E',
  mutedL:  '#A09A93',
  white:   '#FFFFFF',
  green:   '#2D6A4F',
  greenBg: '#EDF7F2',
  redBg:   '#FEF0EA',
}

// ─── MOTION ───────────────────────────────────────────────────────────────────
const MB  = motion(Box)
const MF  = motion(Flex)
const MG  = motion(Grid)
const ease = [0.22, 1, 0.36, 1]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}
const fadeL = {
  hidden: { opacity: 0, x: -28 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
}
const fadeR = {
  hidden: { opacity: 0, x: 28 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
}
const stagger = {
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

// ─── COUNTER ──────────────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [n, setN]   = useState(0)
  const ref         = useRef(null)
  const inView      = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const end  = parseInt(to)
    const step = Math.max(1, Math.ceil(end / 80))
    let cur    = 0
    const t    = setInterval(() => {
      cur = Math.min(cur + step, end)
      setN(cur)
      if (cur >= end) clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [inView, to])
  return <span ref={ref}>{n}{suffix}</span>
}

// ─── EYEBROW / OVERLINE ───────────────────────────────────────────────────────
function Eyebrow({ children, light = false, color }) {
  const col = color || (light ? 'rgba(250,250,248,0.45)' : C.sage)
  return (
    <Flex align="center" gap="10px" mb="18px">
      <Box w="20px" h="1.5px" bg={col} flexShrink={0} borderRadius="2px" />
      <Text
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize="10px" fontWeight="400" letterSpacing="0.18em"
        textTransform="uppercase" color={col}
      >{children}</Text>
    </Flex>
  )
}

// ─── PILL BADGE ───────────────────────────────────────────────────────────────
function Pill({ children, variant = 'green' }) {
  const styles = {
    green:  { bg: C.greenBg, color: C.forest, border: `1px solid #B7E4CC` },
    terra:  { bg: C.redBg,   color: C.terra,  border: `1px solid #F4C5AE` },
    stone:  { bg: C.stone,   color: C.muted,  border: `1px solid ${C.border}` },
  }
  const s = styles[variant] || styles.stone
  return (
    <Box px="10px" py="3px" borderRadius="100px" display="inline-flex" alignItems="center"
      bg={s.bg} border={s.border}>
      <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
        letterSpacing="0.1em" textTransform="uppercase" color={s.color} fontWeight="500">
        {children}
      </Text>
    </Box>
  )
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const go = (id) => { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Process',  href: '#process'  },
    { label: 'Results',  href: '#results'  },
  ]

  return (
    <Box as="nav" position="fixed" top={0} left={0} right={0} zIndex={500}
      bg={scrolled ? 'rgba(250,250,248,0.95)' : 'transparent'}
      backdropFilter={scrolled ? 'blur(20px) saturate(180%)' : 'none'}
      borderBottom={scrolled ? `1px solid ${C.border}` : '1px solid transparent'}
      transition="all 0.3s cubic-bezier(0.4,0,0.2,1)">
      <Flex align="center" justify="space-between"
        px={{ base: '20px', md: '40px', xl: '64px' }} h="64px" maxW="1400px" mx="auto">

        {/* Logo */}
        <Flex align="center" gap="10px" cursor="pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Flex w="34px" h="34px" bg={C.forest} align="center" justify="center" borderRadius="8px">
            <Icon as={ChefHat} boxSize="16px" color={C.canvas} />
          </Flex>
          <Text fontFamily="'Playfair Display', serif" fontSize="19px" fontWeight="700"
            letterSpacing="-0.03em" color={C.ink}>
            Resto<Text as="em" color={C.terra} fontStyle="italic">AI</Text>
          </Text>
        </Flex>

        {/* Desktop nav */}
        <HStack gap="32px" display={{ base: 'none', md: 'flex' }}>
          {links.map(l => (
            <Text key={l.href} fontSize="13px" fontWeight="500" color={C.muted}
              cursor="pointer" letterSpacing="-0.01em"
              onClick={() => go(l.href)}
              _hover={{ color: C.ink }} transition="color 0.2s">
              {l.label}
            </Text>
          ))}
        </HStack>

        {/* CTA buttons */}
        <HStack gap="8px" display={{ base: 'none', md: 'flex' }}>
          <Button onClick={() => navigate('/login')} variant="ghost"
            fontSize="12px" fontWeight="600" color={C.muted} h="36px" px="16px"
            borderRadius="8px" _hover={{ bg: C.stone, color: C.ink }}>
            Sign in
          </Button>
          <Button onClick={() => navigate('/register')}
            bg={C.forest} color={C.canvas}
            fontSize="12px" fontWeight="600" h="36px" px="20px"
            borderRadius="8px" letterSpacing="-0.01em"
            _hover={{ bg: C.forestL }}
            rightIcon={<Icon as={ArrowRight} boxSize="13px" />}>
            Get started
          </Button>
        </HStack>

        {/* Mobile hamburger */}
        <IconButton display={{ base: 'flex', md: 'none' }}
          icon={<Icon as={open ? X : Menu} boxSize="20px" />}
          variant="ghost" aria-label="Menu" size="sm" color={C.ink}
          onClick={() => setOpen(p => !p)} />
      </Flex>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <MB initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} overflow="hidden"
            bg={C.canvas} borderTop={`1px solid ${C.border}`}>
            <VStack align="stretch" px="20px" py="16px" gap="0">
              {links.map(l => (
                <Text key={l.href} py="13px" fontSize="15px" color={C.muted} cursor="pointer"
                  borderBottom={`1px solid ${C.border}`}
                  onClick={() => go(l.href)} _hover={{ color: C.ink }}>
                  {l.label}
                </Text>
              ))}
              <HStack gap="8px" pt="16px">
                <Button flex="1" variant="outline" borderColor={C.border} borderRadius="8px"
                  fontSize="13px" color={C.ink} onClick={() => navigate('/login')}>Sign in</Button>
                <Button flex="1" bg={C.forest} color={C.canvas} borderRadius="8px"
                  fontSize="13px" onClick={() => navigate('/register')}>Get started</Button>
              </HStack>
            </VStack>
          </MB>
        )}
      </AnimatePresence>
    </Box>
  )
}

// ─── DASHBOARD MOCKUP ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <Box
      bg={C.white} borderRadius="16px" overflow="hidden"
      border={`1px solid ${C.border}`}
      boxShadow="0 32px 80px rgba(26,26,24,0.12), 0 8px 24px rgba(26,26,24,0.06)">

      {/* Title bar */}
      <Flex align="center" justify="space-between" px="16px" py="11px"
        borderBottom={`1px solid ${C.border}`} bg={C.stone}>
        <HStack gap="5px">
          {['#F87171','#FBBF24','#34D399'].map(c => (
            <Box key={c} w="8px" h="8px" borderRadius="full" bg={c} />
          ))}
        </HStack>
        <Flex align="center" gap="6px" bg={C.white} px="10px" py="4px"
          borderRadius="6px" border={`1px solid ${C.border}`}>
          <Box w="5px" h="5px" borderRadius="full" bg={C.green} />
          <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
            color={C.muted} letterSpacing="0.06em">RestoAI · Live</Text>
        </Flex>
        <Box w="56px" />
      </Flex>

      {/* KPI row */}
      <Grid templateColumns="repeat(3,1fr)" borderBottom={`1px solid ${C.border}`}>
        {[
          { label: 'Revenue today', val: '₹48,320', delta: '+18.4%', pos: true },
          { label: 'Orders',        val: '142',      delta: '+9 today', pos: true },
          { label: 'Food waste',    val: '−42%',     delta: 'Target hit', pos: true },
        ].map(({ label, val, delta, pos }, i) => (
          <Box key={label} px="14px" py="14px"
            borderRight={i < 2 ? `1px solid ${C.border}` : 'none'}>
            <Text fontFamily="'JetBrains Mono', monospace" fontSize="8.5px"
              letterSpacing="0.1em" textTransform="uppercase" color={C.mutedL} mb="6px">
              {label}
            </Text>
            <Text fontFamily="'Playfair Display', serif" fontSize="21px"
              fontWeight="700" color={C.ink} lineHeight="1" letterSpacing="-0.02em">
              {val}
            </Text>
            <Flex align="center" gap="4px" mt="5px">
              <Box w="5px" h="5px" borderRadius="full" bg={pos ? C.green : C.terra} flexShrink={0} />
              <Text fontSize="10px" color={pos ? C.green : C.terra} fontWeight="600">{delta}</Text>
            </Flex>
          </Box>
        ))}
      </Grid>

      {/* Mini chart */}
      <Box px="14px" pt="14px" pb="10px" borderBottom={`1px solid ${C.border}`}>
        <Flex justify="space-between" align="center" mb="12px">
          <Text fontFamily="'JetBrains Mono', monospace" fontSize="8.5px"
            letterSpacing="0.1em" textTransform="uppercase" color={C.mutedL}>
            Weekly revenue
          </Text>
          <Pill variant="green">↑ 23% vs last week</Pill>
        </Flex>
        <Flex align="flex-end" gap="4px" h="52px" mb="6px">
          {[42,58,51,76,65,88,71].map((h, i) => (
            <Box key={i} flex="1" borderRadius="3px 3px 0 0" transition="height 0.3s"
              bg={h === 88 ? C.forest : h === 76 ? C.sage : C.stoneD}
              style={{ height: `${h}%` }} />
          ))}
        </Flex>
        <Flex justify="space-between">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <Text key={d} fontFamily="'JetBrains Mono', monospace"
              fontSize="8px" color={C.mutedL} flex="1" textAlign="center">{d}</Text>
          ))}
        </Flex>
      </Box>

      {/* AI alert */}
      <Flex align="center" gap="10px" px="14px" py="11px"
        bg={C.redBg} borderBottom={`1px solid #F4C5AE`}>
        <Box w="6px" h="6px" borderRadius="full" bg={C.terra} flexShrink={0} />
        <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
          letterSpacing="0.04em" color={C.terra}>
          AI alert: Chicken breast low — reorder in 2 days
        </Text>
      </Flex>

      {/* Recent orders */}
      <Box px="14px" py="12px">
        <Text fontFamily="'JetBrains Mono', monospace" fontSize="8.5px"
          letterSpacing="0.1em" textTransform="uppercase" color={C.mutedL} mb="10px">
          Live orders
        </Text>
        {[
          { table: 'T-04', item: 'Dal Makhani + Naan',  status: 'Served',   time: '2m' },
          { table: 'T-11', item: 'Paneer Tikka Masala', status: 'Kitchen',  time: '8m' },
          { table: 'T-07', item: 'Biryani (×2)',        status: 'Pending',  time: '1m' },
        ].map(({ table, item, status, time }) => (
          <Flex key={table} align="center" justify="space-between"
            py="7px" borderBottom={`1px solid ${C.border}`} _last={{ borderBottom: 'none' }}>
            <Flex align="center" gap="8px">
              <Box w="5px" h="5px" borderRadius="full"
                bg={status === 'Served' ? C.green : status === 'Kitchen' ? C.sage : C.terra} />
              <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                color={C.ink} fontWeight="500">{table}</Text>
              <Text fontSize="10px" color={C.muted} noOfLines={1}>{item}</Text>
            </Flex>
            <Flex align="center" gap="8px">
              <Text fontFamily="'JetBrains Mono', monospace" fontSize="8px" color={C.mutedL}>{time} ago</Text>
              <Box px="7px" py="2px" borderRadius="4px"
                bg={status === 'Served' ? C.greenBg : status === 'Kitchen' ? '#EEF5F3' : C.redBg}>
                <Text fontFamily="'JetBrains Mono', monospace" fontSize="8px" fontWeight="500"
                  color={status === 'Served' ? C.green : status === 'Kitchen' ? C.sage : C.terra}>
                  {status}
                </Text>
              </Box>
            </Flex>
          </Flex>
        ))}
      </Box>
    </Box>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ navigate }) {
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <Box as="section" pt="64px" bg={C.canvas} position="relative" overflow="hidden">
      {/* Subtle dot grid */}
      <Box position="absolute" inset="0" pointerEvents="none" opacity={0.4}
        style={{
          backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
      {/* Green glow top-right */}
      <Box position="absolute" top="-10%" right="-5%" w="600px" h="600px"
        borderRadius="full" pointerEvents="none"
        style={{ background: 'radial-gradient(circle, rgba(27,67,50,0.06) 0%, transparent 70%)' }} />
      {/* Terra glow bottom-left */}
      <Box position="absolute" bottom="10%" left="-8%" w="400px" h="400px"
        borderRadius="full" pointerEvents="none"
        style={{ background: 'radial-gradient(circle, rgba(196,98,45,0.05) 0%, transparent 70%)' }} />

      <Box maxW="1400px" mx="auto" px={{ base: '20px', md: '40px', xl: '64px' }}>
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
          gap={{ base: '48px', lg: '64px' }} alignItems="center"
          py={{ base: '72px', md: '96px', lg: '112px' }}>

          {/* Left */}
          <MB variants={stagger} initial="hidden" animate="show">
            <MB variants={fadeUp} mb="20px">
              <Flex align="center" gap="10px">
                <Pill variant="green">New — AI demand forecasting v3</Pill>
                <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                  color={C.sage} letterSpacing="0.1em">2026</Text>
              </Flex>
            </MB>

            <MB variants={fadeUp} mb="24px">
              <Text
                fontFamily="'Playfair Display', serif"
                fontSize={{ base: '52px', md: '68px', xl: '80px' }}
                fontWeight="700" lineHeight="1.0" letterSpacing="-0.035em"
                color={C.ink}>
                The kitchen<br />
                runs on{' '}
                <Text as="span" color={C.terra} fontStyle="italic">data,</Text>
                <br />
                not instinct.
              </Text>
            </MB>

            <MB variants={fadeUp} mb="36px">
              <Text fontSize={{ base: '15px', md: '16px' }} color={C.muted}
                maxW="420px" lineHeight="1.8" fontWeight="400">
                Demand forecasting, waste reduction, and margin optimisation — unified
                for restaurant operators who think in numbers.
              </Text>
            </MB>

            <MB variants={fadeUp} mb="48px">
              <HStack gap="12px" flexWrap="wrap">
                <Button bg={C.forest} color={C.canvas}
                  fontSize="13px" fontWeight="600" letterSpacing="-0.01em"
                  h="46px" px="24px" borderRadius="10px"
                  _hover={{ bg: C.forestL, transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(27,67,50,0.25)' }}
                  transition="all 0.2s"
                  rightIcon={<Icon as={ArrowRight} boxSize="14px" />}
                  onClick={() => navigate('/register')}>
                  Start free trial
                </Button>
                <Button variant="outline" borderColor={C.border}
                  fontSize="13px" fontWeight="500" color={C.muted}
                  h="46px" px="24px" borderRadius="10px"
                  _hover={{ bg: C.stone, color: C.ink, borderColor: C.ink }}
                  onClick={() => scrollTo('#features')}>
                  See how it works
                </Button>
              </HStack>
              <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                letterSpacing="0.08em" color={C.mutedL} mt="14px">
                No credit card · 14-day free trial · Cancel anytime
              </Text>
            </MB>

            {/* Stats row */}
            <MB variants={fadeUp}>
              <Flex gap="0" pt="28px" borderTop={`1px solid ${C.border}`}>
                {[
                  { val: '40', suffix: '%', label: 'Less food waste' },
                  { val: '25', suffix: '%', label: 'More profit margin' },
                  { val: '98', suffix: '%', label: 'Forecast accuracy' },
                ].map(({ val, suffix, label }, i) => (
                  <Box key={label} flex="1"
                    pl={i === 0 ? 0 : '24px'} pr={i === 2 ? 0 : '24px'}
                    borderRight={i < 2 ? `1px solid ${C.border}` : 'none'}>
                    <Text fontFamily="'Playfair Display', serif"
                      fontSize="36px" fontWeight="700" letterSpacing="-0.03em"
                      color={C.ink} lineHeight="1">
                      <Counter to={val} suffix={suffix} />
                    </Text>
                    <Text fontFamily="'JetBrains Mono', monospace" fontSize="8px"
                      letterSpacing="0.1em" textTransform="uppercase"
                      color={C.mutedL} mt="6px">{label}</Text>
                  </Box>
                ))}
              </Flex>
            </MB>
          </MB>

          {/* Right — dashboard */}
          <MB initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.3, ease }}
            position="relative" display={{ base: 'none', lg: 'block' }}>
            {/* Floating chips */}
            <MB initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5, ease }}
              position="absolute" top="20px" left="-48px" zIndex={3}
              bg={C.white} border={`1px solid ${C.border}`}
              borderRadius="12px" px="14px" py="12px"
              boxShadow="0 8px 24px rgba(26,26,24,0.1)">
              <Flex align="center" gap="10px">
                <Flex w="32px" h="32px" bg={C.greenBg} align="center"
                  justify="center" borderRadius="8px">
                  <Icon as={TrendingUp} boxSize="14px" color={C.green} />
                </Flex>
                <Box>
                  <Text fontFamily="'Playfair Display', serif" fontSize="17px"
                    fontWeight="700" color={C.green} lineHeight="1">+₹8,200</Text>
                  <Text fontFamily="'JetBrains Mono', monospace" fontSize="8px"
                    color={C.mutedL} letterSpacing="0.08em">vs yesterday</Text>
                </Box>
              </Flex>
            </MB>

            <MB initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5, ease }}
              position="absolute" bottom="60px" right="-40px" zIndex={3}
              bg={C.white} border={`1px solid ${C.border}`}
              borderRadius="12px" px="14px" py="12px"
              boxShadow="0 8px 24px rgba(26,26,24,0.1)">
              <Flex align="center" gap="10px">
                <Flex w="32px" h="32px" bg={C.redBg} align="center"
                  justify="center" borderRadius="8px">
                  <Icon as={Leaf} boxSize="14px" color={C.terra} />
                </Flex>
                <Box>
                  <Text fontFamily="'Playfair Display', serif" fontSize="17px"
                    fontWeight="700" color={C.terra} lineHeight="1">−42%</Text>
                  <Text fontFamily="'JetBrains Mono', monospace" fontSize="8px"
                    color={C.mutedL} letterSpacing="0.08em">food waste this week</Text>
                </Box>
              </Flex>
            </MB>

            <DashboardMockup />
          </MB>
        </Grid>
      </Box>

      {/* Divider band */}
      <Box borderTop={`1px solid ${C.border}`} />
    </Box>
  )
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
function Marquee() {
  const names = ['Spice Route Mumbai','Urban Kitchen Delhi','FoodChain India','The Amber Table','Curry Leaf Goa','Oven Story','Bombay Brasserie','The Fatty Bao','Burma Burma','Farzi Cafe']
  const doubled = [...names, ...names]
  return (
    <Box bg={C.stone} borderTop={`1px solid ${C.border}`}
      borderBottom={`1px solid ${C.border}`} overflow="hidden" py="15px">
      <Flex whiteSpace="nowrap" align="center"
        sx={{
          animation: 'scroll 30s linear infinite',
          '@keyframes scroll': {
            '0%':   { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}>
        {doubled.map((name, i) => (
          <Flex key={i} align="center" gap="0" flexShrink={0}>
            <Text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="13px"
              fontWeight="500" color={C.muted} px="24px" letterSpacing="-0.01em">
              {name}
            </Text>
            <Box w="4px" h="4px" borderRadius="full" bg={C.border} flexShrink={0} />
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const features = [
    { n: '01', title: 'AI Demand Forecasting', desc: 'Trained on weather, local events, and 24 months of your own data. Accurate to within 2% on peak days.' },
    { n: '02', title: 'Smart Inventory',        desc: 'Auto-tracks stock levels, flags expiry risks, and generates purchase orders before you ever run out.' },
    { n: '03', title: 'Menu Intelligence',      desc: 'Know exactly which dishes build margin and which quietly drain your kitchen resources and prep time.' },
  ]
  return (
    <Box as="section" borderBottom={`1px solid ${C.border}`}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }}>
        <MB variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          px={{ base: '20px', md: '40px', xl: '64px' }}
          py={{ base: '64px', md: '96px' }}
          bg={C.forest} position="relative" overflow="hidden">
          {/* Pattern overlay */}
          <Box position="absolute" inset="0" pointerEvents="none" opacity={0.04}
            style={{
              backgroundImage: `radial-gradient(circle, rgba(250,250,248,1) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }} />
          <Box position="relative" zIndex={1}>
            <MB variants={fadeL}>
              <Eyebrow light>01 — Why RestoAI</Eyebrow>
            </MB>
            <MB variants={fadeL}>
              <Text fontFamily="'Playfair Display', serif"
                fontSize={{ base: '44px', md: '60px', xl: '72px' }}
                fontWeight="700" lineHeight="1.0" letterSpacing="-0.03em"
                color={C.canvas}>
                Most kitchens<br />run on{' '}
                <Text as="em" color="#E8C97A" fontStyle="italic">gut feel.</Text>
                <br />Yours won't.
              </Text>
            </MB>
            <MB variants={fadeL} mt="28px">
              <Text fontSize="15px" color="rgba(250,250,248,0.55)"
                maxW="380px" lineHeight="1.85" fontWeight="400">
                Restaurant margins are brutally thin. The gap between profit and loss is
                often one bad week of over-ordering or one unexpected demand spike.
              </Text>
            </MB>
          </Box>
        </MB>

        <MB variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          px={{ base: '20px', md: '40px', xl: '64px' }}
          py={{ base: '64px', md: '96px' }}
          display="flex" flexDirection="column" justifyContent="center">
          <VStack align="stretch" gap="0">
            {features.map(({ n, title, desc }) => (
              <MB key={n} variants={fadeR}
                display="flex" alignItems="flex-start" gap="18px"
                borderTop={`1px solid ${C.border}`} py="24px"
                _last={{ borderBottom: `1px solid ${C.border}` }}
                _hover={{ bg: C.stone }} px="4px"
                transition="background 0.2s" borderRadius="4px">
                <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                  letterSpacing="0.14em" color={C.terra} mt="3px" flexShrink={0}>
                  {n}
                </Text>
                <Box>
                  <Text fontSize="14px" fontWeight="600" letterSpacing="-0.01em"
                    color={C.ink} mb="6px">{title}</Text>
                  <Text fontSize="13px" lineHeight="1.75" color={C.muted}>{desc}</Text>
                </Box>
              </MB>
            ))}
          </VStack>
        </MB>
      </Grid>
    </Box>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const items = [
    { icon: Bell,          title: 'Proactive alerts',    desc: 'Know before problems happen — low stock, spoilage risk, staffing gaps all surfaced in advance.' },
    { icon: Package,       title: 'Smart inventory',     desc: 'Automated tracking eliminates over-ordering and flags expiry risks before they hit your margin.' },
    { icon: Users,         title: 'Staff scheduling',    desc: 'Optimal shifts built on predicted footfall. Never over- or understaffed again.' },
    { icon: MessageSquare, title: 'Voice input',         desc: 'Kitchen staff speaks, the system listens. No typing needed during busy service.' },
    { icon: Brain,         title: 'Demand forecasting',  desc: 'Predict exactly how much you\'ll need — 98% accuracy, driven by weather, local events, and 24 months of pattern learning across your own data.' },
    { icon: BarChart3,     title: 'Revenue analytics',   desc: 'Deep visibility across every menu item, table, shift, and day part.' },
    { icon: PieChart,      title: 'Waste reduction',     desc: 'Precision reporting shows exactly where losses occur so you can eliminate them systematically.' },
    { icon: Utensils,      title: 'Menu intelligence',   desc: 'Understand which dishes actually drive margin and which quietly drain kitchen resources.' },
  ]

  return (
    <Box as="section" id="features" borderBottom={`1px solid ${C.border}`}>
      {/* Header */}
      <Box maxW="1400px" mx="auto" px={{ base: '20px', md: '40px', xl: '64px' }}>
        <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          py={{ base: '56px', md: '80px' }}
          display="flex" alignItems="flex-end" justifyContent="space-between"
          flexWrap="wrap" gap="24px">
          <Box>
            <MB variants={fadeL}><Eyebrow>02 — Features</Eyebrow></MB>
            <MB variants={fadeL}>
              <Text fontFamily="'Playfair Display', serif"
                fontSize={{ base: '42px', md: '60px' }} fontWeight="700"
                lineHeight="1.0" letterSpacing="-0.03em" color={C.ink}>
                Every tool<br />in one place.
              </Text>
            </MB>
          </Box>
          <MB variants={fadeR}>
            <Text fontSize="14px" color={C.muted} lineHeight="1.8"
              maxW="280px" fontWeight="400">
              Built by restaurateurs — not generic SaaS with a chef's hat bolted on.
            </Text>
          </MB>
        </MB>
      </Box>

      {/* Grid */}
      <Box borderTop={`1px solid ${C.border}`}>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}>
          {items.map((item, i) => {
            const isHero = i === 4
            return (
              <MB key={i} variants={fadeUp} initial="hidden"
                whileInView="show" viewport={{ once: true, amount: 0.1 }}
                gridColumn={isHero ? { base: '1', sm: 'span 2' } : 'auto'}
                bg={isHero ? C.ink : C.canvas}
                p={{ base: '28px 24px', md: '36px 32px' }}
                borderRight={`1px solid ${isHero ? 'rgba(255,255,255,0.07)' : C.border}`}
                borderBottom={`1px solid ${isHero ? 'rgba(255,255,255,0.07)' : C.border}`}
                position="relative" cursor="default" role="group"
                _hover={{
                  bg: isHero ? '#222220' : C.stone,
                  transition: 'background 0.2s',
                }}>

                <Flex w="38px" h="38px"
                  bg={isHero ? 'rgba(250,250,248,0.06)' : C.stone}
                  border={`1px solid ${isHero ? 'rgba(250,250,248,0.1)' : C.border}`}
                  align="center" justify="center" mb="22px" borderRadius="10px">
                  <Icon as={item.icon} boxSize="16px"
                    color={isHero ? '#E8C97A' : C.terra} />
                </Flex>

                <Text fontSize="14px" fontWeight="600" letterSpacing="-0.01em"
                  color={isHero ? C.canvas : C.ink} mb="8px">{item.title}</Text>
                <Text fontSize="12.5px" lineHeight="1.75"
                  color={isHero ? 'rgba(250,250,248,0.45)' : C.muted}
                  maxW={isHero ? '360px' : 'none'}>{item.desc}</Text>

                <Text position="absolute" bottom="14px" right="16px"
                  fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                  letterSpacing="0.1em"
                  color={isHero ? 'rgba(255,255,255,0.06)' : C.border}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
              </MB>
            )
          })}
        </Grid>
      </Box>
    </Box>
  )
}

// ─── PROCESS ──────────────────────────────────────────────────────────────────
function Process() {
  const steps = [
    { n: '01', icon: ShoppingCart, title: 'Connect inventory', desc: 'Link your existing POS or set up from scratch in under 10 minutes.' },
    { n: '02', icon: Target,       title: 'Set your targets',  desc: 'Define waste limits, safety stock, and revenue goals for your operation.' },
    { n: '03', icon: Brain,        title: 'AI gets to work',   desc: 'Models process your data and generate actionable daily forecasts.' },
    { n: '04', icon: CheckCircle,  title: 'Make better calls', desc: 'Act on precise recommendations. Less guesswork. More profit, every service.' },
  ]
  return (
    <Box as="section" id="process" borderBottom={`1px solid ${C.border}`}>
      <Box maxW="1400px" mx="auto" px={{ base: '20px', md: '40px', xl: '64px' }}
        py={{ base: '64px', md: '96px' }}>
        <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          <MB variants={fadeUp}><Eyebrow>03 — Process</Eyebrow></MB>
          <MB variants={fadeUp} mb="56px">
            <Text fontFamily="'Playfair Display', serif"
              fontSize={{ base: '42px', md: '60px' }} fontWeight="700"
              lineHeight="1.0" letterSpacing="-0.03em" color={C.ink}>
              Running in<br />four steps.
            </Text>
          </MB>

          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
            gap="0">
            {steps.map(({ n, icon, title, desc }, i) => (
              <MB key={n} variants={fadeUp}
                pr={{ base: '0', lg: i < 3 ? '40px' : '0' }}
                pl={{ base: '0', lg: i > 0 ? '40px' : '0' }}
                py={{ base: '28px', lg: '0' }}
                borderRight={{ lg: i < 3 ? `1px solid ${C.border}` : 'none' }}
                borderBottom={{ base: i < 3 ? `1px solid ${C.border}` : 'none', lg: 'none' }}>

                {/* Connector line */}
                <Flex align="center" mb="28px" gap="0">
                  <Box w="10px" h="10px" borderRadius="full" bg={C.terra} flexShrink={0}
                    boxShadow={`0 0 0 3px ${C.redBg}`} />
                  <Box flex="1" h="1px" bg={C.border} />
                </Flex>

                <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
                  letterSpacing="0.14em" textTransform="uppercase"
                  color={C.terra} mb="14px">Step {n}</Text>

                <Flex w="40px" h="40px" bg={C.stone} align="center" justify="center"
                  mb="14px" borderRadius="10px" border={`1px solid ${C.border}`}>
                  <Icon as={icon} boxSize="17px" color={C.forest} />
                </Flex>

                <Text fontFamily="'Playfair Display', serif" fontSize="20px"
                  fontWeight="700" letterSpacing="-0.02em" color={C.ink} mb="10px">
                  {title}
                </Text>
                <Text fontSize="13px" lineHeight="1.75" color={C.muted}>{desc}</Text>
              </MB>
            ))}
          </Grid>
        </MB>
      </Box>
    </Box>
  )
}

// ─── RESULTS / SOCIAL PROOF ───────────────────────────────────────────────────
function Results() {
  const testimonials = [
    {
      quote: "We cut food waste by 38% in the first month. The demand forecasting alone paid for the subscription five times over.",
      name: "Ananya Krishnamurthy", role: "Owner, Spice Route Mumbai", initials: "AK",
    },
    {
      quote: "The AI alerts stopped us from running out of protein during a Saturday night service twice in one month. Game changer.",
      name: "Rohan Mehta", role: "Head Chef, Urban Kitchen Delhi", initials: "RM",
    },
    {
      quote: "Finally a restaurant tool that feels like it was built for 2026. Not a spreadsheet bolted to an app.",
      name: "Priya Sharma", role: "Director, FoodChain India", initials: "PS",
    },
  ]

  const dashboards = [
    { 
      role: 'Manager',
      shortDesc: 'Business Intelligence',
      description: 'Real-time revenue analytics, labour cost optimisation, inventory forecasting, and multi-location performance dashboards.',
      color: C.forest,
      icon: BarChart3,
      // Replace with actual dashboard image path
      imageSrc: '/images/d1.png',
      // Fallback gradient if image fails to load
      fallbackGradient: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #1B4332 100%)',
      stats: [
        { label: 'Revenue', value: '₹2.8L', change: '+12%' },
        { label: 'Labour %', value: '28%', change: '-3%' },
        { label: 'COGS', value: '31%', change: '-2%' }
      ],
      features: ['P&L Dashboard', 'Staff Scheduling', 'Menu Engineering', 'Vendor Management'],
      connections: ['Receives order data from Waiter', 'Sends prep lists to Kitchen', 'Views customer feedback']
    },
    { 
      role: 'Waiter',
      shortDesc: 'Floor Operations',
      description: 'Table management, order taking with voice input, split bills, course timing, and real-time kitchen communication.',
      color: C.sage,
      icon: Users,
      imageSrc: '/images/d2.png',
      fallbackGradient: 'linear-gradient(135deg, #52796F 0%, #6B9B8A 50%, #52796F 100%)',
      stats: [
        { label: 'Active Tables', value: '12', change: '+3' },
        { label: 'Avg Ticket', value: '₹1,240', change: '+8%' },
        { label: 'Turn Time', value: '48m', change: '-6m' }
      ],
      features: ['Table Map', 'Order Entry', 'Split Payments', 'Allergy Alerts'],
      connections: ['Sends orders to Kitchen', 'Updates Manager on covers', 'Notifies Customer of wait times']
    },
    { 
      role: 'Kitchen Staff',
      shortDesc: 'Production Control',
      description: 'Live ticket queue with smart routing, prep list automation, inventory depletion alerts, and cooking time analytics.',
      color: C.terra,
      icon: ChefHat,
      imageSrc: '/images/d4.png',
      fallbackGradient: 'linear-gradient(135deg, #C4622D 0%, #E07B45 50%, #C4622D 100%)',
      stats: [
        { label: 'Active Tickets', value: '8', change: 'Normal' },
        { label: 'Avg Cook Time', value: '14m', change: '-2m' },
        { label: 'Prep Status', value: '92%', change: 'Good' }
      ],
      features: ['KDS Display', 'Prep Lists', '86\'d Items', 'Recipe Viewer'],
      connections: ['Receives orders from Waiter', 'Updates inventory with Manager', 'Alerts Waitstaff when food ready']
    },
    { 
      role: 'Customer',
      shortDesc: 'Guest Experience',
      description: 'QR menu browsing, order-ahead capability, loyalty rewards tracking, dietary preference memory, and waitlist management.',
      color: C.green,
      icon: Smartphone,
      imageSrc: '/images/d3.png',
      fallbackGradient: 'linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 50%, #2D6A4F 100%)',
      stats: [
        { label: 'Waitlist', value: '6', change: '15-20m' },
        { label: 'Rewards', value: '340 pts', change: '+50' },
        { label: 'Visits', value: '12', change: 'Loyal' }
      ],
      features: ['QR Menu', 'Order & Pay', 'Loyalty Rewards', 'Waitlist Join'],
      connections: ['Orders flow to Waiter', 'Receives ready alerts from Kitchen', 'Feedback goes to Manager']
    },
  ]

  return (
    <Box as="section" id="results" bg={C.stone} borderBottom={`1px solid ${C.border}`}>
      <Box maxW="1400px" mx="auto" px={{ base: '20px', md: '40px', xl: '64px' }}
        py={{ base: '64px', md: '96px' }}>
        <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          <MB variants={fadeUp}><Eyebrow>04 — Results</Eyebrow></MB>
          <MB variants={fadeUp} mb="24px">
            <Text fontFamily="'Playfair Display', serif"
              fontSize={{ base: '42px', md: '60px' }} fontWeight="700"
              lineHeight="1.0" letterSpacing="-0.03em" color={C.ink}>
              Four roles.<br />One connected system.
            </Text>
          </MB>

          {/* Connection Flow Visualization */}
          <MB variants={fadeUp} mb="48px">
            <Flex 
              align="center" 
              justify="center" 
              gap={{ base: '8px', md: '16px' }}
              flexWrap="wrap"
              bg={C.white}
              p="20px"
              borderRadius="40px"
              border={`1px solid ${C.border}`}
            >
              {dashboards.map((db, i) => (
                <React.Fragment key={db.role}>
                  <Tooltip label={`${db.role}: ${db.shortDesc}`} placement="top">
                    <Flex 
                      align="center" 
                      gap="8px"
                      bg={db.color + '10'}
                      px="14px" 
                      py="8px" 
                      borderRadius="30px"
                      border={`1px solid ${db.color}30`}
                    >
                      <Flex w="24px" h="24px" borderRadius="full" bg={db.color} align="center" justify="center">
                        <Icon as={db.icon} boxSize="10px" color={C.white} />
                      </Flex>
                      <Text fontSize="11px" fontWeight="600" color={db.color} letterSpacing="-0.01em">
                        {db.role}
                      </Text>
                    </Flex>
                  </Tooltip>
                  {i < 3 && (
                    <Box position="relative" w={{ base: '20px', md: '40px' }}>
                      <Icon as={ArrowLeftRight} boxSize="14px" color={C.mutedL} />
                      <Box position="absolute" top="-4px" left="50%" transform="translateX(-50%)" fontSize="8px" color={C.muted}>
                        ↔
                      </Box>
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </Flex>
          </MB>

          {/* Dashboard Photos Grid with Real Images */}
          <MB variants={fadeUp} mb="56px">
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="20px">
              {dashboards.map((db, i) => (
                <Box key={i} position="relative">
                  {/* Dashboard Card with Image */}
                  <Box
                    bg={C.white}
                    border={`1px solid ${C.border}`}
                    borderRadius="20px"
                    overflow="hidden"
                    boxShadow="0 8px 24px rgba(26,26,24,0.06)"
                    transition="all 0.3s"
                    _hover={{ 
                      boxShadow: '0 20px 40px rgba(26,26,24,0.12)', 
                      transform: 'translateY(-6px)',
                      borderColor: db.color + '40'
                    }}
                  >
                    {/* Dashboard Image Section */}
                    <Box position="relative" h="180px" bg={db.color + '10'}>
                      {/* Actual Image - replace with your JPG files */}
                      <Image
                        src={db.imageSrc}
                        alt={`${db.role} Dashboard`}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        fallback={
                          <Box
                            w="100%"
                            h="100%"
                            bg={db.fallbackGradient}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexDirection="column"
                            gap="8px"
                          >
                            <Icon as={db.icon} boxSize="32px" color="rgba(255,255,255,0.9)" />
                            <Text fontSize="11px" color="white" fontWeight="500" fontFamily="'JetBrains Mono', monospace">
                              {db.role} Dashboard
                            </Text>
                            <Text fontSize="8px" color="rgba(255,255,255,0.6)">
                              Click to view full image
                            </Text>
                          </Box>
                        }
                        fallbackStrategy="onError"
                        cursor="zoom-in"
                        onClick={() => window.open(db.imageSrc, '_blank')}
                      />
                      
                      {/* Overlay badge */}
                      <Box
                        position="absolute"
                        top="8px"
                        right="8px"
                        bg="rgba(0,0,0,0.6)"
                        backdropFilter="blur(4px)"
                        px="8px"
                        py="3px"
                        borderRadius="20px"
                      >
                        <Text fontSize="7px" color="white" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">
                          LIVE PREVIEW
                        </Text>
                      </Box>

                      {/* Role badge on image */}
                      <Box
                        position="absolute"
                        bottom="8px"
                        left="8px"
                        bg="rgba(0,0,0,0.5)"
                        backdropFilter="blur(4px)"
                        px="8px"
                        py="3px"
                        borderRadius="20px"
                        display="flex"
                        alignItems="center"
                        gap="4px"
                      >
                        <Icon as={Wifi} boxSize="8px" color="#34D399" />
                        <Text fontSize="8px" color="white" fontWeight="600">
                          {db.role}
                        </Text>
                      </Box>
                    </Box>

                    {/* Dashboard Info Section */}
                    <Box p="16px">
                      {/* Header Info */}
                      <Flex align="center" gap="10px" mb="14px">
                        <Flex w="36px" h="36px" borderRadius="10px" bg={db.color} align="center" justify="center"
                          boxShadow={`0 4px 12px ${db.color}40`}>
                          <Icon as={db.icon} boxSize="16px" color={C.white} />
                        </Flex>
                        <Box flex="1">
                          <Text fontSize="13px" fontWeight="700" color={C.ink} letterSpacing="-0.01em">
                            {db.role} Dashboard
                          </Text>
                          <Text fontSize="9px" color={C.muted} fontFamily="'JetBrains Mono', monospace">
                            {db.shortDesc}
                          </Text>
                        </Box>
                        <Pill variant="stone">v2.4</Pill>
                      </Flex>

                      {/* Stats Grid */}
                      <Grid templateColumns="repeat(3,1fr)" gap="6px" mb="14px">
                        {db.stats.map((stat, idx) => (
                          <Box key={idx} bg={C.stone} borderRadius="8px" p="6px" textAlign="center">
                            <Text fontSize="7px" color={C.mutedL} textTransform="uppercase" letterSpacing="0.05em" mb="2px">
                              {stat.label}
                            </Text>
                            <Text fontSize="13px" fontWeight="700" color={C.ink} lineHeight="1.2">
                              {stat.value}
                            </Text>
                            <Text fontSize="7px" color={stat.change.includes('+') || stat.change.includes('Good') || stat.change.includes('Loyal') ? C.green : stat.change.includes('-') ? C.terra : C.muted}>
                              {stat.change}
                            </Text>
                          </Box>
                        ))}
                      </Grid>

                      {/* Features List */}
                      <VStack align="stretch" gap="6px" mb="12px">
                        {db.features.slice(0, 3).map((feature, idx) => (
                          <Flex key={idx} align="center" gap="8px">
                            <Box w="4px" h="4px" borderRadius="full" bg={db.color} />
                            <Text fontSize="9px" color={C.muted} flex="1">{feature}</Text>
                            <Box w="20px" h="2px" bg={C.border} borderRadius="full" />
                          </Flex>
                        ))}
                      </VStack>

                      {/* Connection Info */}
                      <Box 
                        bg={`${db.color}08`} 
                        borderRadius="8px" 
                        p="8px" 
                        border={`1px solid ${db.color}20`}
                        mb="10px"
                      >
                        <Flex align="center" gap="6px" mb="5px">
                          <Icon as={Bluetooth} boxSize="8px" color={db.color} />
                          <Text fontSize="7px" fontWeight="600" color={db.color} textTransform="uppercase" letterSpacing="0.08em">
                            Connected to:
                          </Text>
                        </Flex>
                        <HStack gap="4px" flexWrap="wrap">
                          {db.connections.map((conn, idx) => (
                            <Box key={idx} px="6px" py="2px" bg={C.white} borderRadius="4px" border={`1px solid ${C.border}`}>
                              <Text fontSize="7px" color={C.muted}>{conn.split(' ')[0]} {conn.split(' ')[1]}</Text>
                            </Box>
                          ))}
                        </HStack>
                      </Box>

                      {/* Status Footer with Image Info */}
                      <Flex justify="space-between" align="center">
                        <Flex align="center" gap="4px">
                          <Box w="5px" h="5px" borderRadius="full" bg="#34D399" />
                          <Text fontSize="7px" color={C.mutedL} fontFamily="'JetBrains Mono', monospace">
                            Sync • Active
                          </Text>
                        </Flex>
                        <HStack gap="4px">
                          <Text fontSize="6px" color={C.mutedL} fontFamily="'JetBrains Mono', monospace">
                            JPG
                          </Text>
                          <Box px="6px" py="2px" borderRadius="4px" bg={db.color} opacity="0.1">
                            <Text fontSize="7px" fontWeight="600" color={db.color}>
                              {i + 1}/4
                            </Text>
                          </Box>
                        </HStack>
                      </Flex>
                    </Box>
                  </Box>

                  {/* Role Label */}
                  <Text 
                    fontFamily="'JetBrains Mono', monospace" 
                    fontSize="9px" 
                    letterSpacing="0.12em" 
                    textTransform="uppercase"
                    color={db.color}
                    textAlign="center"
                    mt="12px"
                    fontWeight="600"
                  >
                    {db.role} INTERFACE
                  </Text>
                  <Text fontSize="10px" color={C.muted} textAlign="center" mt="2px">
                    {db.description.slice(0, 45)}...
                  </Text>
                </Box>
              ))}
            </Grid>
          </MB>

          {/* Image Gallery Note */}
          <MB variants={fadeUp} mb="40px">
            <Flex 
              bg={C.white} 
              border={`1px solid ${C.border}`} 
              borderRadius="16px" 
              p="20px"
              align="center"
              justify="center"
              gap="12px"
              flexWrap="wrap"
            >
              <Icon as={Image} boxSize="16px" color={C.muted} />
              <Text fontSize="11px" color={C.muted} fontFamily="'JetBrains Mono', monospace">
                Dashboard screenshots available in high resolution. 
              </Text>
              <Button 
                variant="ghost" 
                size="xs" 
                color={C.forest}
                fontSize="10px"
                rightIcon={<Icon as={ArrowRight} boxSize="10px" />}
              >
                Download all
              </Button>
            </Flex>
          </MB>

          {/* System Integration Note */}
          <MB variants={fadeUp} mb="56px">
            <Flex 
              bg={C.white} 
              border={`1px solid ${C.border}`} 
              borderRadius="16px" 
              p="24px"
              align="center"
              justify="space-between"
              flexWrap="wrap"
              gap="16px"
            >
              <Flex align="center" gap="16px">
                <Flex w="48px" h="48px" bg={C.forest + '10'} borderRadius="12px" align="center" justify="center">
                  <Icon as={Wifi} boxSize="20px" color={C.forest} />
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="600" color={C.ink} mb="4px">
                    All four dashboards sync in real-time
                  </Text>
                  <Text fontSize="12px" color={C.muted}>
                    When a customer places an order, it instantly appears on the waiter's tablet, 
                    routes to the kitchen display, updates inventory for the manager, and sends 
                    progress notifications back to the customer — all within milliseconds.
                  </Text>
                </Box>
              </Flex>
              <Button 
                variant="outline" 
                borderColor={C.forest} 
                color={C.forest}
                fontSize="11px"
                size="sm"
                rightIcon={<Icon as={ArrowRight} boxSize="12px" />}
                _hover={{ bg: C.forest + '10' }}
              >
                See it in action
              </Button>
            </Flex>
          </MB>

        
        </MB>
      </Box>
    </Box>
  )
}
// ─── CTA BAND ─────────────────────────────────────────────────────────────────
function CTABand({ navigate }) {
  return (
    <Box as="section" borderBottom={`1px solid ${C.border}`}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }}>
        {/* Left — green */}
        <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          bg={C.forest} px={{ base: '20px', md: '40px', xl: '64px' }}
          py={{ base: '64px', md: '96px' }}
          position="relative" overflow="hidden"
          borderRight={{ lg: '1px solid rgba(250,250,248,0.08)' }}>
          <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px"
            borderRadius="full" pointerEvents="none"
            style={{ background: 'radial-gradient(circle, rgba(232,201,122,0.1) 0%, transparent 65%)' }} />
          <Box position="relative" zIndex={1}>
            <MB variants={fadeL}>
              <Eyebrow light>05 — Get started</Eyebrow>
            </MB>
            <MB variants={fadeL}>
              <Text fontFamily="'Playfair Display', serif"
                fontSize={{ base: '44px', md: '60px', xl: '72px' }}
                fontWeight="700" lineHeight="1.0" letterSpacing="-0.03em"
                color={C.canvas}>
                Ready to transform<br />how your kitchen<br />
                <Text as="em" color="#E8C97A" fontStyle="italic">operates?</Text>
              </Text>
            </MB>
            <MB variants={fadeL} mt="24px">
              <Text fontSize="15px" color="rgba(250,250,248,0.5)"
                maxW="360px" lineHeight="1.8">
                Join hundreds of restaurants already using RestoAI to reduce waste,
                boost margins, and run smarter every single day.
              </Text>
            </MB>
          </Box>
        </MB>

        {/* Right — light */}
        <MB initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          px={{ base: '20px', md: '40px', xl: '64px' }}
          py={{ base: '64px', md: '96px' }}
          display="flex" flexDirection="column" justifyContent="center">
          <MB variants={fadeR} mb="32px">
            <VStack align="stretch" gap="12px" maxW="340px">
              <Button bg={C.forest} color={C.canvas}
                fontSize="13px" fontWeight="600" h="48px"
                borderRadius="10px" letterSpacing="-0.01em"
                _hover={{ bg: C.forestL, transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(27,67,50,0.25)' }}
                transition="all 0.2s"
                rightIcon={<Icon as={ArrowRight} boxSize="14px" />}
                onClick={() => navigate('/register')}>
                Start your free trial
              </Button>
              <Button variant="outline" borderColor={C.border}
                fontSize="13px" fontWeight="500" color={C.muted}
                h="48px" borderRadius="10px"
                _hover={{ bg: C.stone, color: C.ink, borderColor: C.stoneD }}>
                Schedule a demo
              </Button>
            </VStack>
          </MB>
          <MB variants={fadeR}>
            <VStack align="start" gap="10px">
              {['No credit card required','14-day free trial, cancel anytime','Expert onboarding included'].map(t => (
                <Flex key={t} align="center" gap="10px">
                  <Flex w="18px" h="18px" borderRadius="full" bg={C.greenBg}
                    align="center" justify="center" flexShrink={0}>
                    <Icon as={CheckCircle} boxSize="11px" color={C.green} />
                  </Flex>
                  <Text fontSize="13px" color={C.muted} fontWeight="400">{t}</Text>
                </Flex>
              ))}
            </VStack>
          </MB>
        </MB>
      </Grid>
    </Box>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: 'Product', links: ['Features','Process','Pricing','Changelog'] },
    { title: 'Company', links: ['About','Blog','Careers','Contact'] },
    { title: 'Legal',   links: ['Privacy','Terms','Cookies','Security'] },
  ]
  return (
    <Box as="footer" bg={C.ink} pt={{ base: '52px', md: '72px' }} pb="36px">
      <Box maxW="1400px" mx="auto" px={{ base: '20px', md: '40px', xl: '64px' }}>
        <Grid templateColumns={{ base: '1fr', sm: '2fr 1fr 1fr 1fr' }}
          gap="48px" mb="48px" pb="40px"
          borderBottom="1px solid rgba(250,250,248,0.07)">
          {/* Brand column */}
          <Box>
            <Flex align="center" gap="10px" mb="16px">
              <Flex w="32px" h="32px" bg="rgba(250,250,248,0.07)"
                align="center" justify="center" borderRadius="8px">
                <Icon as={ChefHat} boxSize="15px" color="#E8C97A" />
              </Flex>
              <Text fontFamily="'Playfair Display', serif" fontSize="18px"
                fontWeight="700" letterSpacing="-0.03em" color={C.canvas}>
                Resto<Text as="em" color="#E8C97A" fontStyle="italic">AI</Text>
              </Text>
            </Flex>
            <Text fontFamily="'JetBrains Mono', monospace" fontSize="9.5px"
              letterSpacing="0.06em" color="rgba(250,250,248,0.22)"
              lineHeight="1.9" maxW="220px">
              AI-powered restaurant management for kitchens that run on data,
              not instinct.
            </Text>
          </Box>

          {/* Link columns */}
          {cols.map(({ title, links }) => (
            <Box key={title}>
              <Text fontFamily="'JetBrains Mono', monospace" fontSize="8.5px"
                letterSpacing="0.15em" textTransform="uppercase"
                color="rgba(250,250,248,0.25)" mb="18px">{title}</Text>
              <VStack align="start" gap="11px">
                {links.map(l => (
                  <Text key={l} as="a" href="#"
                    fontSize="13px" color="rgba(250,250,248,0.42)" fontWeight="400"
                    _hover={{ color: C.canvas }} transition="color 0.2s"
                    letterSpacing="-0.01em">{l}</Text>
                ))}
              </VStack>
            </Box>
          ))}
        </Grid>

        <Flex justify="space-between" align="center" flexWrap="wrap" gap="12px">
          <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
            letterSpacing="0.06em" color="rgba(250,250,248,0.2)">
            © {new Date().getFullYear()} RestoAI. All rights reserved.
          </Text>
          <Flex align="center" gap="8px">
            <Box w="6px" h="6px" borderRadius="full" bg={C.green}
              boxShadow={`0 0 0 3px rgba(45,106,79,0.3)`} />
            <Text fontFamily="'JetBrains Mono', monospace" fontSize="9px"
              letterSpacing="0.06em" color="rgba(250,250,248,0.2)">
              All systems operational
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function HomePageInner() {
  const navigate = useNavigate?.() ?? (() => {})
  return (
    <Box bg={C.canvas} minH="100vh" overflowX="hidden">
      {/* Font import — move to index.html in production */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');
      `}</style>
      <Navbar   navigate={navigate} />
      <Hero     navigate={navigate} />
      <Marquee  />
      <About    />
      <Features />
      <Process  />
      <Results  />
      <CTABand  navigate={navigate} />
      <Footer   />
    </Box>
  )
}

export default function HomePage() {
  return (
    <ChakraProvider theme={theme}>
      <HomePageInner />
    </ChakraProvider>
  )
}