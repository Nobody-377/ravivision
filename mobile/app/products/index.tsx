import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { ProductCard, ProductCardData } from '../../src/components/products/ProductCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/common/EmptyState';
import { COLORS, RADII, SPACING } from '../../src/theme/tokens';
import { apiFetch } from '../../src/api/client';
import { useCartStore } from '../../src/store/useCartStore';
import { Search, ArrowLeft, Filter, X } from 'lucide-react-native';

export default function ProductListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((params.search as string) || '');
  const [selectedCategory, setSelectedCategory] = useState((params.category as string) || '');

  const addToCart = useCartStore((state) => state.addToCart);

  const fetchProducts = async () => {
    setLoading(true);
    let url = '/api/products?limit=50';
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }
    if (selectedCategory.trim()) {
      url += `&category=${encodeURIComponent(selectedCategory.trim())}`;
    }

    const res = await apiFetch(url);
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = () => {
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  return (
    <View style={styles.screen}>
      <Header />

      {/* Search Header Bar */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.textHeading} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Refrigerator, AC, Cooler..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {(selectedCategory || searchQuery) ? (
        <View style={styles.filterChipRow}>
          <Text style={styles.filterLabel}>Filters:</Text>
          {selectedCategory ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory('')}>
                <X size={12} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <LoadingState message="Searching store catalog..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="We couldn't find matching items in store inventory. Try adjusting your search."
            actionLabel="Reset Search"
            onAction={clearFilters}
          />
        ) : (
          <View style={styles.grid}>
            {products.map((item) => (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceGround,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceWhite,
    gap: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textHeading,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.sm,
  },
  searchBtnText: {
    color: COLORS.surfaceWhite,
    fontWeight: '700',
    fontSize: 12,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceWhite,
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 12,
    color: COLORS.statusDanger,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justify: 'space-between',
  },
});
