import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { LoadingState } from '../../src/components/common/LoadingState';
import { COLORS, RADII, SHADOWS, SPACING } from '../../src/theme/tokens';
import { apiFetch } from '../../src/api/client';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';

interface CategoryTaxonomy {
  id: string;
  name: string;
  slug: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    subcategories: {
      id: string;
      name: string;
      slug: string;
    }[];
  }[];
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [taxonomy, setTaxonomy] = useState<CategoryTaxonomy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const res = await apiFetch('/api/categories');
      if (res.success && res.data) {
        setTaxonomy(res.data);
      }
      setLoading(false);
    }
    loadCategories();
  }, []);

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <LayoutGrid size={22} color={COLORS.primary} />
          <Text style={styles.pageTitle}>Product Categories</Text>
        </View>

        {loading ? (
          <LoadingState message="Loading catalog taxonomy..." />
        ) : taxonomy.length === 0 ? (
          <View style={styles.fallbackBox}>
            {['Televisions', 'Refrigerators', 'Washing Machines', 'ACs', 'Fans', 'Microwaves', 'Inverters', 'Kitchen Appliances', 'Coolers', 'Home Appliances', 'Geysers', 'Wiring Materials'].map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.catRow}
                onPress={() => router.push(`/products?category=${encodeURIComponent(cat)}`)}
              >
                <Text style={styles.catName}>{cat}</Text>
                <ChevronRight size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          taxonomy.map((dept) => (
            <View key={dept.id} style={styles.deptCard}>
              <Text style={styles.deptTitle}>{dept.name}</Text>
              {dept.categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catRow}
                  onPress={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.catName}>{cat.name}</Text>
                    {cat.subcategories.length > 0 && (
                      <Text style={styles.subCount}>
                        {cat.subcategories.length} subcategories available
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          ))
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
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  deptCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  deptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  subCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fallbackBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
  },
});
