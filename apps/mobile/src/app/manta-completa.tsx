import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  formatPrice,
  purchases,
  usePremium,
  type Offering,
  type PlanId,
} from '@/features/paywall/purchases';
import { StageBackground } from '@/features/player/Stage';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { GlidingManta } from '@/ui/Brand';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Press } from '@/ui/Press';
import { IconButton } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Manta completa: nunca antes de la primera clase y siempre se puede cerrar. */
export default function PaywallScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const premium = usePremium();
  const tag = localeTag(locale);
  const ios = Platform.OS !== 'android';

  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selected, setSelected] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    track('paywall_viewed');
    void purchases.getOfferings().then(setOfferings);
  }, []);

  const offering = offerings.find((item) => item.id === selected);
  const price = (item: Offering) => formatPrice(item.priceCents, item.currency, tag);
  const where = ios ? t('paywall.whereIos') : t('paywall.whereAndroid');

  const fine = !offering
    ? ''
    : offering.id === 'annual'
      ? t('paywall.fineAnnual', { days: offering.trialDays, price: price(offering), where })
      : offering.id === 'monthly'
        ? t('paywall.fineMonthly', { price: price(offering), where })
        : t('paywall.fineLifetime');

  const buy = async () => {
    if (!offering) return;
    setBusy(true);
    await purchases.purchase(offering.id);
    track('trial_started', { plan: offering.id });
    setBusy(false);
    setMessage(t('paywall.success'));
    setTimeout(() => router.back(), 1_400);
  };

  const restore = async () => {
    setBusy(true);
    const result = await purchases.restore();
    setBusy(false);
    track('purchase_restored', { premium: result.premium });
    setMessage(result.premium ? t('paywall.restored') : t('paywall.nothingToRestore'));
  };

  const note = (item: Offering) =>
    item.id === 'annual'
      ? t('paywall.annualNote', {
          perMonth: formatPrice(Math.round(item.priceCents / 12), item.currency, tag),
          days: item.trialDays,
        })
      : item.id === 'lifetime'
        ? t('paywall.lifetimeNote')
        : t('paywall.monthlyNote');

  const wave = (y: number) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < width; x += width / 4)
      d += ` Q ${x + width / 16} ${y - 8} ${x + width / 8} ${y} T ${x + width / 4} ${y}`;
    return d;
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <View
          style={{
            height: insets.top + 200,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
          }}
        >
          <StageBackground />
          <GlidingManta width={128} />
          <Svg width={width} height={48} style={{ position: 'absolute', bottom: 18 }}>
            <Path
              d={wave(18)}
              fill="none"
              stroke={palette.name === 'abisal' ? 'rgba(238,244,245,0.35)' : palette.ink}
              strokeWidth={1.4}
            />
            <Path
              d={wave(32)}
              fill="none"
              stroke={palette.name === 'abisal' ? 'rgba(95,227,232,0.6)' : palette.accent}
              strokeWidth={1.4}
            />
          </Svg>
        </View>

        <View
          style={{
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: palette.background,
            paddingHorizontal: space.gutter,
            paddingTop: space.xl,
            gap: space.m,
          }}
        >
          <Text variant="display" accessibilityRole="header">
            {t('paywall.title')}
          </Text>
          <Text variant="body" tone="soft" style={{ marginTop: -space.s }}>
            {t('paywall.subtitle')}
          </Text>

          <View style={{ gap: space.s, marginVertical: space.s }}>
            {(['benefit1', 'benefit2', 'benefit3'] as const).map((key) => (
              <View
                key={key}
                style={{ flexDirection: 'row', gap: space.s, alignItems: 'flex-start' }}
              >
                <Icon name="check" size={18} color={palette.accent} />
                <Text variant="callout" style={{ flex: 1 }}>
                  {t(`paywall.${key}`)}
                </Text>
              </View>
            ))}
          </View>

          {premium ? (
            <Text variant="body" weight="semibold" accessibilityLiveRegion="polite">
              {t('paywall.success')}
            </Text>
          ) : (
            <>
              <View style={{ gap: space.s }} accessibilityRole="radiogroup">
                {offerings.map((item) => {
                  const active = item.id === selected;
                  return (
                    <Press
                      key={item.id}
                      haptic
                      onPress={() => setSelected(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${t(`paywall.${item.id}`)}, ${price(item)}, ${note(item)}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.m,
                        minHeight: 68,
                        paddingHorizontal: space.l,
                        borderRadius: ios ? 18 : 14,
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? palette.accent : palette.border,
                        backgroundColor: palette.surface,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: active ? 7 : 2,
                          borderColor: active ? palette.accent : palette.inkSoft,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: space.s,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Text variant="callout" weight="semibold">
                            {t(`paywall.${item.id}`)}
                          </Text>
                          {item.trialDays > 0 ? (
                            <View
                              style={{
                                backgroundColor: palette.primary,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 1,
                              }}
                            >
                              <Text
                                variant="caption"
                                weight="semibold"
                                color={palette.onPrimary}
                                style={{ fontSize: 12 }}
                              >
                                {t('paywall.trialBadge', { days: item.trialDays })}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text variant="caption" tone="soft">
                          {note(item)}
                        </Text>
                      </View>
                      <Text
                        variant="callout"
                        weight="semibold"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {price(item)}
                      </Text>
                    </Press>
                  );
                })}
              </View>

              <Button
                label={
                  offering && offering.trialDays > 0
                    ? t('paywall.ctaTrial', { days: offering.trialDays })
                    : t('paywall.ctaBuy')
                }
                onPress={buy}
                loading={busy}
                disabled={!offering}
                style={{ marginTop: space.s }}
              />
              <Text variant="caption" tone="soft" align="center">
                {fine}
              </Text>
            </>
          )}

          {message ? (
            <Text variant="callout" weight="medium" align="center" accessibilityLiveRegion="polite">
              {message}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              columnGap: space.l,
            }}
          >
            <Button
              label={t('paywall.restore')}
              variant="quiet"
              size="small"
              block={false}
              onPress={restore}
            />
            <Button
              label={t('paywall.gift')}
              icon="gift"
              variant="quiet"
              size="small"
              block={false}
              onPress={() => setMessage(t('paywall.giftSoon'))}
            />
          </View>
          <Text variant="caption" tone="soft" align="center">
            {t('paywall.terms')} · {t('paywall.demo')}
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          top: insets.top + space.s,
          left: space.m,
          right: space.m,
          flexDirection: 'row',
          justifyContent: ios ? 'flex-end' : 'flex-start',
        }}
      >
        <IconButton name="close" label={t('common.close')} onPress={() => router.back()} />
      </View>
    </View>
  );
}
