import React, { useState } from 'react';
import { RealTimeLabel, ShipRecPackage } from '@shared/schema';
import { ShipRecPackageList } from './shiprec-package-list';
import { ShipRecPackageDetails } from './shiprec-package-details';
import { convertShipRecPackageToLabel } from '@/lib/shiprec-api';
import { useToast } from '@/hooks/use-toast';

interface RealTimeTrackingProps {
  onLabelAdded: (label: RealTimeLabel) => void;
  onViewOnMap?: (pkg: ShipRecPackage) => void;
}

export function RealTimeTracking({ onLabelAdded, onViewOnMap }: RealTimeTrackingProps) {
  const [selectedPackage, setSelectedPackage] = useState<ShipRecPackage | null>(null);
  const { toast } = useToast();

  const handlePackageSelect = (pkg: ShipRecPackage) => {
    setSelectedPackage(pkg);
    if (pkg.currentLocation && onViewOnMap) {
      onViewOnMap(pkg);
    }
  };

  const handlePackageImport = (pkg: ShipRecPackage) => {
    const label = convertShipRecPackageToLabel(pkg);
    onLabelAdded(label);
    toast({
      title: 'Package Imported',
      description: `Successfully imported ${label.name} to your dashboard`,
    });
  };

  const handleClosePackageDetails = () => {
    setSelectedPackage(null);
  };

  return selectedPackage ? (
    <ShipRecPackageDetails 
      package={selectedPackage} 
      onClose={handleClosePackageDetails}
      onViewOnMap={onViewOnMap}
    />
  ) : (
    <ShipRecPackageList 
      onSelectPackage={handlePackageSelect}
      onImportPackage={handlePackageImport}
    />
  );
}