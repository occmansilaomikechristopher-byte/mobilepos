# Modern Price Quotation Management System
## Glass & Aluminum Supply Business

### 📋 Overview

A comprehensive quotation management system built for React Native that allows staff to create accurate customer quotations for glass panels, aluminum bars, and accessories with automatic price calculations based on material specifications, labor costs, and market pricing.

### ✨ Key Features

#### 1. **Customer Information Management**
- Capture customer name (required), email, and phone number
- Store customer details with each quotation
- Easy reference for follow-ups and communications

#### 2. **Material Specification Interface**
- **Glass Panel Selection**: 6mm Clear, 8mm Clear, 6mm Tinted, 8mm Tinted, 6mm Reflective, Tempered
- **Aluminum Profile Options**: Standard Frame, Heavy Duty Frame, Slim Frame, Custom Profile
- **Frame Colors**: UPVC White, UPVC Brown
- **Dimension Inputs**: Width and Height with flexible units (MM, CM, IN, Ft, M)

#### 3. **Automatic Price Calculations**
Based on dimensions, the system automatically calculates:
- **Glass Cost**: Area-based calculation with type premiums
  - Clear: 1.0x multiplier
  - Tinted: 1.2x multiplier
  - Reflective: 1.5x multiplier
  - Tempered: 1.4x multiplier
- **Aluminum Cost**: Perimeter-based calculation with profile adjustments
- **Design Customization**: +10% surcharge for French Type Design
- **Total Material Cost**: Combined glass and aluminum costs

#### 4. **Labor & Service Costs**
Configurable labor components:
- **Installation Fee**: ₱500 per panel (optional)
- **Design Customization Fee**: ₱1,500 (optional)
- **Measurement & Consultation Fee**: ₱300 (optional)

Toggle switches for each service:
- `installationRequired` - Professional installation
- `customDesignRequired` - Custom design work
- `measurementRequired` - On-site measurement and assessment

#### 5. **Advanced Pricing Configuration**
- **Discount Options**:
  - Fixed amount (₱)
  - Percentage (%)
- **Tax Settings**: Configurable tax percentage (default 12% VAT for Philippines)
- **Real-time Calculations**: All prices update automatically

#### 6. **Detailed Cost Breakdown**
Line-by-line itemization with:
- Item name and description
- Quantity and unit price
- Line total calculation
- Material vs. Labor differentiation

#### 7. **Quotation Summary**
Professional summary showing:
- Subtotal
- Discount (amount shown)
- Tax (calculated based on taxable amount)
- Final total

#### 8. **Cart & Quotation Management**
- Add multiple quotation items to cart
- Delete individual items
- Clear entire cart with confirmation
- Visual indicator of line items per quotation
- Expandable saved quotations view

#### 9. **Quotation Saving & Retrieval**
- Save complete quotations with customer details
- Generate unique quotation numbers (Format: QT-YYYYMMDD-RANDOM)
- View quotation history
- Expandable details for each saved quotation

### 📱 User Interface

#### Modern Design Elements
- **Color Scheme**: 
  - Primary: Teal (#0f766e) - Professional and trustworthy
  - Accent: Light Cyan (#ecfeff) - Highlighting key sections
  - Neutral: Light Gray (#f8fafc) - Backgrounds
  - Error: Red (#ef4444) - Destructive actions

- **Typography**:
  - Section Titles: 15px, Bold 800, Dark text
  - Labels: 12px, Bold 700, Uppercase
  - Body: 13-14px, Regular to Semi-bold

- **Components**:
  - Card-based layouts with subtle shadows
  - Rounded corners (8-12px border radius)
  - Smooth transitions and responsive spacing
  - Touch-friendly buttons (min 44x44px)

#### Responsive Layout
- Horizontal spacing: 12-16px padding
- Vertical spacing: 12-14px between sections
- 2-column layout for dimension inputs
- Full-width buttons and inputs
- Scrollable content for long forms

### 🔧 Technical Implementation

#### Type Definitions (`src/types/quotation.ts`)
```typescript
// Core interfaces
- MaterialPrice
- GlassPanel extends MaterialPrice
- AluminumBar extends MaterialPrice
- Accessory extends MaterialPrice
- LaborConfig
- QuotationDimensions
- QuotationLineItem
- CustomerQuotation
- QuotationCalculationContext
```

#### Calculation Engine (`src/utils/quotationCalculator.ts`)

**Conversion Functions**:
- `convertToSquareMeters()` - Area calculations
- `convertToMeters()` - Length calculations
- `calculatePerimeter()` - Perimeter for aluminum

**Cost Calculators**:
- `calculateGlassCost()` - Glass pricing
- `calculateAluminumCost()` - Aluminum pricing
- `calculateAccessoriesCost()` - Accessories sum
- `calculateLaborCost()` - Labor component breakdown

**Quotation Generation**:
- `generateLineItems()` - Create detailed line items array
- `calculateSubtotal()` - Sum all line items
- `calculateDiscount()` - Apply fixed or percentage discount
- `calculateTax()` - VAT calculation
- `calculateTotal()` - Final amount

**Formatting**:
- `formatCurrency()` - Philippine Peso formatting
- `formatQuotationDate()` - Date display

#### Component State Management (`POSQuotationTab.tsx`)

**Customer Info**:
```typescript
const [customerName, setCustomerName] = useState('');
const [customerEmail, setCustomerEmail] = useState('');
const [customerPhone, setCustomerPhone] = useState('');
```

**Product Specifications**:
```typescript
const [glassType, setGlassType] = useState('6mm Clear');
const [aluminumProfile, setAluminumProfile] = useState('Standard Frame');
const [width, setWidth] = useState('48');
const [height, setHeight] = useState('48');
const [panelCount, setPanelCount] = useState('1');
```

**Labor Options**:
```typescript
const [installationRequired, setInstallationRequired] = useState(false);
const [customDesignRequired, setCustomDesignRequired] = useState(false);
const [measurementRequired, setMeasurementRequired] = useState(false);
```

**Pricing**:
```typescript
const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
const [discountValue, setDiscountValue] = useState('0');
const [taxPercentage, setTaxPercentage] = useState('12');
```

### 📊 Data Flow

```
User Input (Dimensions, Materials, Labor)
        ↓
quotationSummary useMemo Hook
        ↓
Calculation Engine Functions
        ↓
Line Items Array + Summary (subtotal, discount, tax, total)
        ↓
UI Rendering (Cost Breakdown, Summary, Buttons)
        ↓
Add to Cart
        ↓
Save Quotation (POST to API)
        ↓
Update Saved Quotations List
```

### 🎨 Style System

Comprehensive StyleSheet with 90+ style definitions:

**Layout**:
- `screen` - Main container
- `content` - Scrollable content padding
- `card` - Reusable card component

**Components**:
- `input`, `picker` - Form inputs
- `optionButton`, `optionButtonActive` - Choice buttons
- `lineItemBox` - Line item container
- `cartItemContainer` - Cart item display

**Typography**:
- `sectionTitle`, `label`, `sectionLabel` - Text hierarchy
- `required` - Required field indicator

**Buttons**:
- `addToCartButton` - Primary action
- `saveQuotationButton` - Secondary action
- `clearButton` - Destructive action

### 💡 Usage Example

1. **Enter Customer Info**
   - Name: "Juan Dela Cruz"
   - Email: "juan@example.com"
   - Phone: "09123456789"

2. **Select Materials**
   - Glass: 6mm Clear
   - Aluminum: Standard Frame
   - Frame Color: UPVC White

3. **Enter Dimensions**
   - Width: 48
   - Height: 48
   - Unit: IN
   - Number of Panels: 2

4. **Configure Options**
   - Design: French Type Design (+10%)
   - Installation: Yes (+₱1,000 for 2 panels)
   - Measurement: Yes (+₱300)

5. **Set Pricing**
   - Discount: 5% (Percentage)
   - Tax: 12% (Default VAT)

6. **Review & Save**
   - See cost breakdown
   - Confirm total
   - Save quotation with all details

### 🔄 API Integration

The system integrates with existing POS API:
- `savePosQuotation()` - Save complete quotation
- `fetchPosQuotations()` - Retrieve saved quotations
- `fetchPosProducts()` - Get product list with pricing

### 📈 Future Enhancements

- Email quotation to customers
- PDF export with professional formatting
- Quotation templates for common orders
- Bulk quotation generation
- Material cost adjustments and tracking
- Commission calculations for sales staff
- Quotation approval workflow
- Version history and quotation amendments

### ⚙️ Configuration

**Labor Rates** (`laborConfig` object):
```typescript
const laborConfig = {
    hourlyRate: 350,                    // ₱/hour
    installationFeePerPanel: 500,       // ₱/panel
    designCustomizationFee: 1500,       // ₱ fixed
    measurementFee: 300,                // ₱ fixed
};
```

**Material Options** (`choices` object):
```typescript
const choices = {
    frame: ['UPVC White Frame', 'UPVC Brown Frame'],
    unit: ['MM', 'CM', 'IN', 'Ft', 'M'],
    design: ['None', 'French Type Design'],
    glassType: ['6mm Clear', '8mm Clear', ...],
    aluminumProfile: ['Standard Frame', ...],
};
```

### 📝 Notes

- All prices are in Philippine Pesos (₱)
- Dimensions support international units (MM to M)
- Real-time calculations provide instant feedback
- Quotations are uniquely identified with timestamp-based numbers
- System handles edge cases (zero dimensions, invalid inputs)
- Responsive design works on various device sizes
- No internet connection handling (local storage ready)

### 🚀 Getting Started

1. Import the component in your navigation structure
2. Ensure `posService.ts` API endpoints are configured
3. Configure `laborConfig` rates for your business
4. Customize `choices` options as needed
5. Test with sample dimensions and pricing
6. Deploy to production

---

**Version**: 1.0.0  
**Last Updated**: 2026-08-26  
**Status**: ✅ Complete & Ready for Integration
