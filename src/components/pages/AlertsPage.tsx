import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LowStockAlert {
  medicine: HomeopathicMedicines;
  currentStock: number;
  reorderLevel: number;
}

interface ExpiryAlert {
  batch: InventoryBatches;
  daysUntilExpiry: number;
  medicineName: string;
}

export default function AlertsPage() {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, batchesResult] = await Promise.all([
        BaseCrudService.getAll<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAll<InventoryBatches>('inventorybatches')
      ]);

      const medicines = medicinesResult.items;
      const batches = batchesResult.items;

      // Calculate low stock alerts
      const lowStock: LowStockAlert[] = [];
      medicines.forEach(medicine => {
        const totalStock = batches
          .filter(b => b.medicineSKU === medicine.medicineName)
          .reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);
        
        if (totalStock <= (medicine.reorderLevel || 0)) {
          lowStock.push({
            medicine,
            currentStock: totalStock,
            reorderLevel: medicine.reorderLevel || 0
          });
        }
      });

      // Calculate expiry alerts (within 6 months)
      const today = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const expiring: ExpiryAlert[] = [];
      batches.forEach(batch => {
        if (batch.expiryDate && batch.quantityAvailable && batch.quantityAvailable > 0) {
          const expiryDate = new Date(batch.expiryDate);
          if (expiryDate <= sixMonthsFromNow && expiryDate >= today) {
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const medicine = medicines.find(m => m.medicineName === batch.medicineSKU);
            expiring.push({
              batch,
              daysUntilExpiry,
              medicineName: medicine?.medicineName || batch.medicineSKU || 'Unknown Medicine'
            });
          }
        }
      });

      // Sort by urgency
      expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setLowStockAlerts(lowStock);
      setExpiryAlerts(expiring);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExpiryUrgency = (days: number): 'critical' | 'warning' | 'info' => {
    if (days <= 30) return 'critical';
    if (days <= 90) return 'warning';
    return 'info';
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
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Stock Alerts</h1>
          <p className="font-paragraph text-base sm:text-lg text-foreground/70">
            Monitor low stock warnings and medicines approaching expiry
          </p>
        </motion.div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg border-2 border-destructive/40 shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/15 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="font-paragraph text-sm font-semibold text-gray-700">Low Stock Alerts</p>
                <p className="font-heading text-4xl font-bold text-destructive">{lowStockAlerts.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg border-2 border-accent-gold/40 shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-gold/15 rounded-lg">
                <Clock className="w-8 h-8 text-accent-gold" />
              </div>
              <div>
                <p className="font-paragraph text-sm font-semibold text-gray-700">Expiry Alerts</p>
                <p className="font-heading text-4xl font-bold text-accent-gold">{expiryAlerts.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="low-stock" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="low-stock" className="font-paragraph">
              Low Stock ({lowStockAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="expiry" className="font-paragraph">
              Expiry Alerts ({expiryAlerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Low Stock Alerts */}
          <TabsContent value="low-stock">
            <div className="min-h-[400px]">
              {isLoading ? null : lowStockAlerts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {lowStockAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.medicine._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-6 rounded-lg border border-destructive/30 hover:border-destructive/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="p-2 bg-destructive/10 rounded-lg h-fit">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading text-xl text-foreground mb-2">
                              {alert.medicine.medicineName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline">{alert.medicine.potency}</Badge>
                              <Badge variant="outline">{alert.medicine.formType}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-paragraph text-sm">
                              <div>
                                <p className="text-gray-600 font-medium">Current Stock</p>
                                <p className="font-medium text-destructive text-base">{alert.currentStock} units</p>
                              </div>
                              <div>
                                <p className="text-gray-600 font-medium">Reorder Level</p>
                                <p className="font-medium text-gray-900 text-base">{alert.reorderLevel} units</p>
                              </div>
                              <div>
                                <p className="text-gray-600 font-medium">Manufacturer</p>
                                <p className="font-medium text-gray-900 text-base">{alert.medicine.manufacturer}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-16 h-16 text-foreground/60 mb-4" />
                  <p className="font-heading text-xl text-foreground mb-2">No Low Stock Alerts</p>
                  <p className="font-paragraph text-base text-foreground/60 max-w-md text-center">
                    All medicines are currently above their reorder levels. Your inventory is in good condition.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Expiry Alerts */}
          <TabsContent value="expiry">
            <div className="min-h-[400px]">
              {isLoading ? null : expiryAlerts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {expiryAlerts.map((alert, index) => {
                    const urgency = getExpiryUrgency(alert.daysUntilExpiry);
                    const urgencyColors = {
                      critical: 'border-destructive/30 hover:border-destructive/50',
                      warning: 'border-accent-gold/30 hover:border-accent-gold/50',
                      info: 'border-secondary/30 hover:border-secondary/50'
                    };

                    return (
                      <motion.div
                        key={alert.batch._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-white p-6 rounded-lg border transition-all ${urgencyColors[urgency]}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            <div className={`p-2 rounded-lg h-fit ${
                              urgency === 'critical' ? 'bg-destructive/10' :
                              urgency === 'warning' ? 'bg-accent-gold/10' :
                              'bg-secondary/10'
                            }`}>
                              <Clock className={`w-5 h-5 ${
                                urgency === 'critical' ? 'text-destructive' :
                                urgency === 'warning' ? 'text-accent-gold' :
                                'text-secondary'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-heading text-xl text-foreground mb-2">
                                {alert.medicineName}
                              </h3>
                              <div className="mb-3">
                                <Badge variant={urgency === 'critical' ? 'destructive' : 'outline'}>
                                  Expires in {alert.daysUntilExpiry} days
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-paragraph text-sm">
                                <div>
                                  <p className="text-gray-600 font-medium">Batch Number</p>
                                  <p className="font-medium text-gray-900 text-base">{alert.batch.batchNumber}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">Quantity</p>
                                  <p className="font-medium text-gray-900 text-base">{alert.batch.quantityAvailable} units</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">Expiry Date</p>
                                  <p className="font-medium text-gray-900 text-base">
                                    {alert.batch.expiryDate ? new Date(alert.batch.expiryDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">Supplier</p>
                                  <p className="font-medium text-gray-900 text-base">{alert.batch.supplierName}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Clock className="w-16 h-16 text-foreground/60 mb-4" />
                  <p className="font-paragraph text-lg text-foreground/60">No expiry alerts</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
