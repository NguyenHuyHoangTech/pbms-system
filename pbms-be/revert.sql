ALTER TABLE dbo.pricing_policies DROP CONSTRAINT FK_pricing_policies_vehicle_type;
GO
ALTER TABLE dbo.pricing_policies DROP COLUMN vehicle_type_id;
GO
ALTER TABLE dbo.pricing_policies ADD vehicle_type VARCHAR(50);
GO
UPDATE dbo.pricing_policies SET vehicle_type = 'CAR';
GO
