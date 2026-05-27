import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { formatCurrency } from '../../currency/src';
import type { TrendDataPoint } from '../../dashboard/src';

// Register fonts for PDF
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCOlF5N7hG4k3e5q7W1Mw.ttf' },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCOlF5N7hG4k3e5q7W1Mw.ttf',
      fontWeight: 'bold',
    },
  ],
});

Font.register({
  family: 'GeistMono',
  src: 'https://fonts.gstatic.com/s/geistmono/v1/ght-vf1hG5GbElGdEtBzG72pKA.ttf',
});

interface SalesReportProps {
  data: TrendDataPoint[];
  tenantName: string;
  dateRange: { from: string; to: string };
  locale: 'pt-BR' | 'es-PY';
  currency: 'PYG' | 'USD' | 'BRL';
  totalSales: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FAF9F6',
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#0B0B0B',
  },
  header: {
    borderBottom: 1,
    borderColor: '#004225',
    paddingBottom: 15,
    marginBottom: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B0B0B',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  tenantBadge: {
    backgroundColor: '#004225',
    color: '#FAF9F6',
    padding: '4 10',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 20,
  },
  summaryCard: {
    flex: 1,
    borderLeft: 3,
    borderColor: '#004225',
    paddingLeft: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    paddingRight: 10,
  },
  summaryLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'GeistMono',
    color: '#0B0B0B',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004225',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#004225',
    color: '#FAF9F6',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    padding: 6,
    fontSize: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'GeistMono',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
    borderTop: 1,
    borderColor: '#E0E0E0',
    paddingTop: 8,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    color: 'rgba(0, 66, 37, 0.03)',
    fontWeight: 'bold',
  },
});

const labels = {
  'pt-BR': {
    title: 'Relatório Executivo de Vendas',
    generatedOn: 'Gerado em',
    period: 'Período',
    totalSales: 'Total de Vendas',
    transactionCount: 'Qtd. Transações',
    avgTicket: 'Ticket Médio',
    date: 'Data',
    amount: 'Valor',
    footer: 'AXIS ERP — Relatório Executivo',
  },
  'es-PY': {
    title: 'Informe Ejecutivo de Ventas',
    generatedOn: 'Generado el',
    period: 'Período',
    totalSales: 'Total de Ventas',
    transactionCount: 'Cant. Transacciones',
    avgTicket: 'Ticket Promedio',
    date: 'Fecha',
    amount: 'Monto',
    footer: 'AXIS ERP — Informe Ejecutivo',
  },
};

export function SalesReportPDF({
  data,
  tenantName,
  dateRange,
  locale,
  currency,
  totalSales,
}: SalesReportProps) {
  const t = labels[locale] || labels['pt-BR'];
  const count = data.length;
  const avg = count > 0 ? totalSales / count : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>AXIS</Text>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>
                {tenantName} • {t.generatedOn}{' '}
                {new Date().toLocaleDateString(locale)}
              </Text>
            </View>
            <View style={styles.tenantBadge}>
              <Text>AXIS ERP</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {t.period}: {dateRange.from} — {dateRange.to}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t.totalSales}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalSales, currency, locale)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t.transactionCount}</Text>
            <Text style={styles.summaryValue}>{count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t.avgTicket}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(avg, currency, locale)}
            </Text>
          </View>
        </View>

        {/* Data Table */}
        <Text style={styles.sectionTitle}>Detalhamento por Período</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCell}>{t.date}</Text>
            <Text style={[styles.tableCellRight, { flex: 1 }]}>{t.amount}</Text>
          </View>
          {data.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? { backgroundColor: '#FAFAFA' } : {},
              ]}
            >
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCellRight}>
                {formatCurrency(item.total, currency, locale)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {t.footer} • © {new Date().getFullYear()} • {tenantName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default SalesReportPDF;
