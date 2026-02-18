import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches, StockTransactionLedger } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockSummary {
  totalMedicines: number;
  totalBatches: number;
  lowStockCount: number;
  expiringCount: number;
}

interface TopMedicine {
  name: string;
  totalStock: number;
  batches: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<StockSummary>({
    totalMedicines: 0,
    totalBatches: 0,
    lowStockCount: 0,
    expiringCount: 0
  });
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransactionLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, batchesResult, transactionsResult] = await Promise.all([
        BaseCrudService.getAll<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAll<InventoryBatches>('inventorybatches'),
        BaseCrudService.getAll<StockTransactionLedger>('stocktransactionledger')
      ]);

      const medicines = medicinesResult.items;
      const batches = batchesResult.items;
      const transactions = transactionsResult.items;

      // Calculate summary
      let lowStockCount = 0;
      let expiringCount = 0;
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      medicines.forEach(medicine => {
        const totalStock = batches
          .filter(b => b.medicineSKU === medicine.medicineName)
          .reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);
        
        if (totalStock <= (medicine.reorderLevel || 0)) {
          lowStockCount++;
        }
      });

      batches.forEach(batch => {
        if (batch.expiryDate && batch.quantityAvailable && batch.quantityAvailable > 0) {
          const expiryDate = new Date(batch.expiryDate);
          if (expiryDate <= threeMonthsFromNow && expiryDate >= new Date()) {
            expiringCount++;
          }
        }
      });

      setSummary({
        totalMedicines: medicines.length,
        totalBatches: batches.length,
        lowStockCount,
        expiringCount
      });

      // Calculate top medicines by stock
      const medicineStocks = medicines.map(medicine => {
        const medicineBatches = batches.filter(b => b.medicineSKU === medicine.medicineName);
        const totalStock = medicineBatches.reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);
        return {
          name: medicine.medicineName || '',
          totalStock,
          batches: medicineBatches.length
        };
      });

      medicineStocks.sort((a, b) => b.totalStock - a.totalStock);
      setTopMedicines(medicineStocks.slice(0, 10));

      // Get recent transactions
      const sortedTransactions = transactions.sort((a, b) => {
        const dateA = a.transactionDateTime ? new Date(a.transactionDateTime).getTime() : 0;
        const dateB = b.transactionDateTime ? new Date(b.transactionDateTime).getTime() : 0;
        return dateB - dateA;
      });
      setRecentTransactions(sortedTransactions.slice(0, 10));

    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Reports & Analytics</h1>
          <p className="font-paragraph text-base sm:text-lg text-foreground/70">
            View inventory analytics, consumption trends, and stock summaries
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-secondary/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">
                  Total Medicines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-heading text-3xl text-foreground">{summary.totalMedicines}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-secondary/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">
                  Total Batches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <p className="font-heading text-3xl text-foreground">{summary.totalBatches}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="font-heading text-3xl text-foreground">{summary.lowStockCount}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-accent-gold/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent-gold/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-accent-gold" />
                  </div>
                  <p className="font-heading text-3xl text-foreground">{summary.expiringCount}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Medicines by Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-secondary/30">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Top Medicines by Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMedicines.length > 0 ? (
                    topMedicines.map((medicine, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg">
                        <div className="flex-1">
                          <p className="font-paragraph font-medium text-foreground">{medicine.name}</p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            {medicine.batches} batches
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-heading text-xl text-primary">{medicine.totalStock}</p>
                          <p className="font-paragraph text-xs text-foreground/60">units</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-paragraph text-sm text-foreground/60 text-center py-8">
                      No data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-secondary/30">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-start justify-between p-4 bg-background rounded-lg">
                        <div className="flex-1">
                          <p className="font-paragraph font-medium text-foreground">{transaction.medicineSku}</p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            {transaction.transactionType} • {transaction.auditReason}
                          </p>
                          <p className="font-paragraph text-xs text-foreground/50 mt-1">
                            {transaction.transactionDateTime ? new Date(transaction.transactionDateTime).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-heading text-lg ${
                            (transaction.quantityChange || 0) > 0 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {(transaction.quantityChange || 0) > 0 ? '+' : ''}{transaction.quantityChange}
                          </p>
                          <p className="font-paragraph text-xs text-foreground/60">units</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-paragraph text-sm text-foreground/60 text-center py-8">
                      No transactions found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Inventory Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Inventory Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-background rounded-lg">
                  <p className="font-paragraph text-sm text-foreground/60 mb-2">Stock Health</p>
                  <p className="font-heading text-2xl text-foreground mb-1">
                    {summary.totalMedicines > 0 
                      ? Math.round(((summary.totalMedicines - summary.lowStockCount) / summary.totalMedicines) * 100)
                      : 0}%
                  </p>
                  <p className="font-paragraph text-xs text-foreground/60">
                    Medicines above reorder level
                  </p>
                </div>

                <div className="p-6 bg-background rounded-lg">
                  <p className="font-paragraph text-sm text-foreground/60 mb-2">Batch Coverage</p>
                  <p className="font-heading text-2xl text-foreground mb-1">
                    {summary.totalMedicines > 0 
                      ? (summary.totalBatches / summary.totalMedicines).toFixed(1)
                      : 0}
                  </p>
                  <p className="font-paragraph text-xs text-foreground/60">
                    Average batches per medicine
                  </p>
                </div>

                <div className="p-6 bg-background rounded-lg">
                  <p className="font-paragraph text-sm text-foreground/60 mb-2">Expiry Risk</p>
                  <p className="font-heading text-2xl text-foreground mb-1">
                    {summary.totalBatches > 0 
                      ? Math.round((summary.expiringCount / summary.totalBatches) * 100)
                      : 0}%
                  </p>
                  <p className="font-paragraph text-xs text-foreground/60">
                    Batches expiring in 3 months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
