import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { PincodeChecker } from '../../src/components/common/PincodeChecker';
import { ProductCard, ProductCardData } from '../../src/components/products/ProductCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { apiFetch } from '../../src/api/client';
import { useCartStore } from '../../src/store/useCartStore';
import {
  Snowflake,
  Wind,
  Fan,
  Shirt,
  BatteryCharging,
  LayoutGrid,
  Truck,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';

const FALLBACK_PRODUCTS: ProductCardData[] = [
  {
    id: 'fb-1',
    brand: 'Haier',
    name: '240L Double Door Frost Free Refrigerator',
    slug: 'haier-240l-refrigerator',
    price: 24990,
    mrp: 30990,
    discount: '15% OFF',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80',
    stock: 5,
    isAvailable: true,
  },
  {
    id: 'fb-2',
    brand: 'Voltas',
    name: '1.5 Ton 3 Star Inverter Split AC',
    slug: 'voltas-1-5-ton-ac',
    price: 32990,
    mrp: 37990,
    discount: '12% OFF',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    stock: 8,
    isAvailable: true,
  },
  {
    id: 'fb-3',
    brand: 'Symphony',
    name: 'Tower Air Cooler 70L High Thrust',
    slug: 'symphony-tower-air-cooler',
    price: 8490,
    mrp: 10990,
    discount: '20% OFF',
    image: 'https://images.unsplash.com/photo-1618941723684-84519965d1b7?w=400&q=80',
    stock: 12,
    isAvailable: true,
  },
  {
    id: 'fb-4',
    brand: 'LG',
    name: '7.0 kg Fully Automatic Front Load Washing Machine',
    slug: 'lg-7kg-washing-machine',
    price: 28990,
    mrp: 34990,
    discount: '17% OFF',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
    stock: 4,
    isAvailable: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);

  const fetchHomeProducts = async () => {
    try {
      const res = await apiFetch('/api/products?limit=10');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data);
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeProducts();
  };

  const quickCategories = [
    { name: 'Refrigerators', icon: <Snowflake size={22} color="#0284c7" />, category: 'Refrigerators' },
    { name: 'Air Conditioners', icon: <Wind size={22} color="#0d9488" />, category: 'Air Conditioners' },
    { name: 'Coolers', icon: <Fan size={22} color="#2563eb" />, category: 'Coolers' },
    { name: 'Washing Machines', icon: <Shirt size={22} color="#4f46e5" />, category: 'Washing Machines' },
    { name: 'Inverters', icon: <BatteryCharging size={22} color="#d97706" />, category: 'Inverters & Batteries' },
    { name: 'All Categories', icon: <LayoutGrid size={22} color="#475569" />, category: '' },
  ];

  const displayProducts = products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Local Store Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Sparkles size={14} color={COLORS.surfaceWhite} />
            <Text style={styles.heroBadgeText}>OFFICIAL KARGAHAR STORE</Text>
          </View>
          <Text style={styles.heroTitle}>Ravi Vision Electronics & Home Appliances</Text>
          <Text style={styles.heroSubtitle}>
            100% Genuine Products • Local Kargahar Warranty & Express Delivery
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push('/products')}
            activeOpacity={0.8}
          >
            <Text style={styles.heroBtnText}>Explore All Products</Text>
            <ArrowRight size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Pincode Availability Checker */}
        <View style={styles.sectionMargin}>
          <PincodeChecker />
        </View>

        {/* Quick Category Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>
        <View style={styles.categoryGrid}>
          {quickCategories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.categoryCard}
              onPress={() => {
                if (cat.category) {
                  router.push(`/products?category=${encodeURIComponent(cat.category)}`);
                } else {
                  router.push('/(tabs)/categories');
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.categoryIconCircle}>{cat.icon}</View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Products */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.md }]}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState message="Loading latest inventory..." />
        ) : (
          <View style={styles.productsGrid}>
            {displayProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onPress={() => router.push(`/products/${item.slug || item.id}`)}
                onAddToCart={async () => {
                  const success = await addToCart(item.id, 1);
                  if (success) {
                    Alert.alert('Item Added to Cart', `${item.name} has been added to your cart successfully.`);
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* Store Trust Guarantees */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Why Buy From Ravi Vision?</Text>

          <View style={styles.trustGrid}>
            <View style={styles.trustCard}>
              <Truck size={24} color={COLORS.primary} />
              <Text style={styles.trustCardTitle}>Express Delivery</Text>
              <Text style={styles.trustCardDesc}>Same Day Delivery in Kargahar & Surrounding Regions</Text>
            </View>

            <View style={styles.trustCard}>
              <ShieldCheck size={24} color={COLORS.statusSuccess} />
              <Text style={styles.trustCardTitle}>Store Warranty</Text>
              <Text style={styles.trustCardDesc}>100% Genuine Brand Warranty + In-Person Service Support</Text>
            </View>

            <View style={styles.trustCard}>
              <PhoneCall size={24} color={COLORS.statusInfo} />
              <Text style={styles.trustCardTitle}>Call To Order</Text>
              <Text style={styles.trustCardDesc}>Direct Store Helpline: 9631410611 for Instant Assistance</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceGround,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    ...SHADOWS.elevated,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  heroBadgeText: {
    color: COLORS.surfaceWhite,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.surfaceWhite,
    lineHeight: 26,
    marginVertical: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  heroBtn: {
    backgroundColor: COLORS.surfaceWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADII.sm,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionMargin: {
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    justify: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xs,
    ...SHADOWS.card,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textBody,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justify: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  trustSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: SPACING.sm,
  },
  trustGrid: {
    gap: SPACING.sm,
  },
  trustCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  trustCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginTop: 4,
  },
  trustCardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
