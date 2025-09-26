# 📋 **ACCEPTANCE TESTING PLAN (ATP)**
## Print-on-Demand Platform - Manual QA Testing

---

## 📊 **Document Information**

| Field | Details |
|-------|--------|
| **Document Type** | Acceptance Testing Plan (ATP) |
| **Version** | 1.0 |
| **Date** | September 2025 |
| **Platform** | Print-on-Demand E-commerce Platform |
| **Environment** | Production (Vercel) |
| **Test URL** | `https://mvpprintondemand-4d6v6teyj-kevche1985-gmailcoms-projects.vercel.app` |
| **Tester Role** | QA Manual Tester |

---

## 🎯 **Testing Objectives**

### **Primary Goal**
Validate the complete user journey from account registration to successful order completion, ensuring all critical e-commerce functionalities work as expected.

### **Success Criteria**
- ✅ User can successfully register and login
- ✅ Product catalog displays correctly with all categories
- ✅ Shopping cart functionality works properly
- ✅ Checkout process completes without errors
- ✅ Order confirmation and tracking work
- ✅ User dashboard displays order history
- ✅ Admin panel functions for order management

---

## 🧪 **Test Environment Setup**

### **Prerequisites**
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Device**: Desktop and Mobile testing
- **Network**: Stable internet connection
- **Test Data**: Use provided test accounts or create new ones

### **Test URLs**
- **Production**: `https://mvpprintondemand-4d6v6teyj-kevche1985-gmailcoms-projects.vercel.app`
- **Admin Panel**: `/admin`
- **Login Page**: `/auth/login`
- **Registration**: `/auth/register`

### **Test Accounts Available**
| Role | Email | Password | Purpose |
|------|-------|----------|----------|
| Customer | `customer@test.com` | `testpass123` | Regular user testing |
| Admin | `admin@test.com` | `testpass123` | Admin functionality |
| Operator | `operator@test.com` | `testpass123` | Order management |
| Supplier | `supplier@test.com` | `testpass123` | Supplier features |

---

## 🚀 **COMPLETE USER JOURNEY TEST SCENARIOS**

---

## **TEST SCENARIO 1: USER REGISTRATION & AUTHENTICATION**

### **TC-001: New User Registration**

**Objective**: Verify new user can successfully create an account

**Pre-conditions**: 
- User is not logged in
- Valid email address available

**Test Steps**:
1. Navigate to the homepage
2. Click "Sign Up" or "Register" button
3. Fill registration form:
   - **Email**: `newuser@example.com`
   - **Password**: `SecurePass123!`
   - **Confirm Password**: `SecurePass123!`
   - **First Name**: `John`
   - **Last Name**: `Doe`
4. Click "Create Account" button
5. Check for email confirmation (if required)
6. Verify account creation success

**Expected Results**:
- ✅ Registration form validates input correctly
- ✅ Success message appears
- ✅ User is redirected to dashboard or login page
- ✅ Confirmation email sent (if applicable)
- ✅ User can login with new credentials

**Acceptance Criteria**:
- Registration completes without errors
- User receives appropriate feedback
- Account is created in the system

---

### **TC-002: User Login**

**Objective**: Verify existing user can successfully login

**Pre-conditions**: 
- User account exists
- User is not logged in

**Test Steps**:
1. Navigate to login page (`/auth/login`)
2. Enter credentials:
   - **Email**: `customer@test.com`
   - **Password**: `testpass123`
3. Click "Sign In" button
4. Verify successful login

**Expected Results**:
- ✅ Login form accepts valid credentials
- ✅ User is redirected to dashboard
- ✅ Navigation shows user is logged in
- ✅ User profile information displays correctly

**Acceptance Criteria**:
- Authentication works correctly
- User session is established
- Role-based access is applied

---

### **TC-003: Login Validation**

**Objective**: Verify login form validates incorrect credentials

**Test Steps**:
1. Navigate to login page
2. Test invalid credentials:
   - **Wrong Email**: `wrong@email.com`
   - **Wrong Password**: `wrongpassword`
3. Verify error handling

**Expected Results**:
- ✅ Error message displays for invalid credentials
- ✅ User remains on login page
- ✅ No unauthorized access granted

---

## **TEST SCENARIO 2: PRODUCT CATALOG BROWSING**

### **TC-004: Homepage Product Display**

**Objective**: Verify products display correctly on homepage

**Test Steps**:
1. Navigate to homepage
2. Verify product categories display:
   - Business Cards
   - Flyers & Brochures
   - Banners & Signs
   - Digital Products
   - Stickers & Labels
3. Check featured products section
4. Verify product images load correctly
5. Check product pricing displays

**Expected Results**:
- ✅ All product categories visible
- ✅ Product images load without errors
- ✅ Prices display in correct format
- ✅ Product names and descriptions visible
- ✅ "View Details" or "Add to Cart" buttons present

---

### **TC-005: Product Category Navigation**

**Objective**: Verify users can browse products by category

**Test Steps**:
1. Click on "Business Cards" category
2. Verify category page loads
3. Check product filtering options
4. Test sorting functionality (price, name, etc.)
5. Verify pagination (if applicable)

**Expected Results**:
- ✅ Category page displays relevant products only
- ✅ Filtering works correctly
- ✅ Sorting changes product order
- ✅ Pagination navigates properly

---

### **TC-006: Product Detail Page**

**Objective**: Verify individual product pages display complete information

**Test Steps**:
1. Click on "Standard Business Cards" product
2. Verify product detail page loads
3. Check product information:
   - Product name and description
   - Price and variants
   - Product images
   - Customization options
   - Add to cart functionality
4. Test image gallery (if available)
5. Verify quantity selector

**Expected Results**:
- ✅ All product information displays correctly
- ✅ Images are high quality and load properly
- ✅ Price updates with variant selection
- ✅ Quantity selector works
- ✅ Add to cart button is functional

---

## **TEST SCENARIO 3: SHOPPING CART FUNCTIONALITY**

### **TC-007: Add Products to Cart**

**Objective**: Verify users can add products to shopping cart

**Test Steps**:
1. Navigate to "Standard Business Cards" product
2. Select quantity: `500 cards`
3. Choose customization options (if available)
4. Click "Add to Cart" button
5. Verify cart icon updates with item count
6. Add second product: "FOLDCOTE Flyers"
7. Select quantity: `100 flyers`
8. Add to cart

**Expected Results**:
- ✅ Products added to cart successfully
- ✅ Cart icon shows correct item count
- ✅ Success notification appears
- ✅ Cart total updates correctly
- ✅ Product variants saved correctly

---

### **TC-008: Cart Management**

**Objective**: Verify cart management functionality

**Test Steps**:
1. Click cart icon to open cart
2. Verify cart contents:
   - Product names and images
   - Quantities and prices
   - Subtotal calculation
3. Test quantity updates:
   - Increase business cards to 1000
   - Decrease flyers to 50
4. Test item removal:
   - Remove one item from cart
5. Verify cart total recalculates

**Expected Results**:
- ✅ Cart displays all added products
- ✅ Quantity changes update prices
- ✅ Item removal works correctly
- ✅ Subtotal calculates accurately
- ✅ Cart persists across page navigation

---

### **TC-009: Cart Persistence**

**Objective**: Verify cart contents persist across sessions

**Test Steps**:
1. Add products to cart (if not already done)
2. Navigate to different pages
3. Refresh the browser
4. Log out and log back in
5. Verify cart contents remain

**Expected Results**:
- ✅ Cart contents persist during navigation
- ✅ Cart survives browser refresh
- ✅ Cart contents restored after re-login

---

## **TEST SCENARIO 4: CHECKOUT PROCESS**

### **TC-010: Checkout Initiation**

**Objective**: Verify checkout process can be initiated

**Pre-conditions**: 
- User is logged in
- Cart contains at least one product

**Test Steps**:
1. Open shopping cart
2. Click "Proceed to Checkout" button
3. Verify checkout page loads
4. Check checkout sections:
   - Order summary
   - Shipping information
   - Payment options

**Expected Results**:
- ✅ Checkout page loads without errors
- ✅ Order summary displays cart contents
- ✅ Shipping form is present
- ✅ Payment options are available

---

### **TC-011: Shipping Information**

**Objective**: Verify shipping information form works correctly

**Test Steps**:
1. Fill shipping information form:
   - **First Name**: `John`
   - **Last Name**: `Doe`
   - **Email**: `john.doe@example.com`
   - **Phone**: `+1-555-123-4567`
   - **Address**: `123 Main Street`
   - **City**: `New York`
   - **State**: `NY`
   - **ZIP Code**: `10001`
   - **Country**: `United States`
2. Verify form validation
3. Test "Same as shipping" for billing address
4. Proceed to payment section

**Expected Results**:
- ✅ All form fields accept input correctly
- ✅ Form validation works for required fields
- ✅ Address validation functions properly
- ✅ Billing address auto-fills when selected

---

### **TC-012: Payment Method Selection**

**Objective**: Verify payment options are available and functional

**Test Steps**:
1. Review available payment methods:
   - PayPal
   - Credit Card (if available)
   - Other payment options
2. Select PayPal payment
3. Verify payment method selection updates
4. Check order total and tax calculations

**Expected Results**:
- ✅ Payment methods display correctly
- ✅ Payment selection updates interface
- ✅ Order total includes tax and shipping
- ✅ Currency displays correctly

---

### **TC-013: Order Review and Confirmation**

**Objective**: Verify order review and final confirmation

**Test Steps**:
1. Review order summary:
   - Products and quantities
   - Shipping address
   - Payment method
   - Order total
2. Verify all information is correct
3. Check terms and conditions checkbox
4. Click "Place Order" button
5. Wait for order processing

**Expected Results**:
- ✅ Order summary displays all information correctly
- ✅ Terms and conditions must be accepted
- ✅ Place order button initiates processing
- ✅ Loading indicator shows during processing

---

## **TEST SCENARIO 5: ORDER COMPLETION & CONFIRMATION**

### **TC-014: Order Success Page**

**Objective**: Verify order completion and success page

**Test Steps**:
1. After placing order, verify redirect to success page
2. Check order confirmation details:
   - Order number
   - Order date
   - Products ordered
   - Shipping address
   - Payment status
3. Verify order confirmation email (if applicable)
4. Check "View Order" or "Track Order" links

**Expected Results**:
- ✅ Success page displays order confirmation
- ✅ Order number is generated and displayed
- ✅ All order details are accurate
- ✅ Confirmation email sent (if configured)
- ✅ Links to order tracking work

---

### **TC-015: Order History in User Dashboard**

**Objective**: Verify order appears in user's order history

**Test Steps**:
1. Navigate to user dashboard
2. Click "My Orders" or "Order History"
3. Verify recent order appears in list
4. Check order details:
   - Order status
   - Order date
   - Total amount
   - Products ordered
5. Click on order to view full details

**Expected Results**:
- ✅ Order appears in order history
- ✅ Order status is correct (pending/processing)
- ✅ Order details match what was ordered
- ✅ Order detail page loads correctly

---

## **TEST SCENARIO 6: ADMIN PANEL TESTING**

### **TC-016: Admin Login and Dashboard**

**Objective**: Verify admin can access admin panel

**Test Steps**:
1. Logout from customer account
2. Login with admin credentials:
   - **Email**: `admin@test.com`
   - **Password**: `testpass123`
3. Navigate to admin panel (`/admin`)
4. Verify admin dashboard loads
5. Check admin navigation menu

**Expected Results**:
- ✅ Admin can login successfully
- ✅ Admin panel is accessible
- ✅ Admin dashboard displays key metrics
- ✅ Admin navigation menu is present

---

### **TC-017: Order Management**

**Objective**: Verify admin can manage orders

**Test Steps**:
1. In admin panel, navigate to "Orders"
2. Verify order list displays recent orders
3. Find the test order created earlier
4. Click on order to view details
5. Test order status updates:
   - Change status from "pending" to "processing"
   - Add order notes
   - Save changes

**Expected Results**:
- ✅ Order list displays all orders
- ✅ Order details page loads correctly
- ✅ Order status can be updated
- ✅ Order notes can be added
- ✅ Changes are saved successfully

---

## **TEST SCENARIO 7: RESPONSIVE DESIGN & MOBILE TESTING**

### **TC-018: Mobile Responsiveness**

**Objective**: Verify platform works on mobile devices

**Test Steps**:
1. Open platform on mobile device or use browser dev tools
2. Test mobile navigation:
   - Hamburger menu
   - Product browsing
   - Cart functionality
3. Complete a mobile purchase:
   - Add product to cart
   - Proceed through checkout
   - Complete order

**Expected Results**:
- ✅ Mobile navigation works smoothly
- ✅ All pages are responsive
- ✅ Touch interactions work correctly
- ✅ Mobile checkout process completes

---

## **TEST SCENARIO 8: ERROR HANDLING & EDGE CASES**

### **TC-019: Network Error Handling**

**Objective**: Verify platform handles network issues gracefully

**Test Steps**:
1. Simulate slow network connection
2. Test form submissions with network delays
3. Verify loading states and error messages
4. Test offline behavior (if applicable)

**Expected Results**:
- ✅ Loading indicators appear during delays
- ✅ Error messages are user-friendly
- ✅ Forms don't submit multiple times
- ✅ Graceful degradation for offline scenarios

---

### **TC-020: Input Validation Testing**

**Objective**: Verify all forms validate input correctly

**Test Steps**:
1. Test registration form with invalid data:
   - Invalid email formats
   - Weak passwords
   - Missing required fields
2. Test checkout form with invalid data:
   - Invalid phone numbers
   - Invalid ZIP codes
   - Missing required fields
3. Verify error messages are clear and helpful

**Expected Results**:
- ✅ Invalid input is rejected
- ✅ Clear error messages displayed
- ✅ Form highlights problematic fields
- ✅ User can correct errors easily

---

## 📊 **TEST EXECUTION TRACKING**

### **Test Results Template**

| Test Case | Status | Notes | Tester | Date |
|-----------|--------|-------|--------|------|
| TC-001 | ⏳ Pending | | | |
| TC-002 | ⏳ Pending | | | |
| TC-003 | ⏳ Pending | | | |
| ... | ⏳ Pending | | | |

**Status Legend**:
- ✅ **Pass**: Test completed successfully
- ❌ **Fail**: Test failed, issues found
- ⏳ **Pending**: Test not yet executed
- 🔄 **Retest**: Test needs to be re-executed
- ⚠️ **Blocked**: Test cannot be executed due to dependencies

---

## 🐛 **DEFECT REPORTING TEMPLATE**

### **Bug Report Format**

```
**Bug ID**: BUG-001
**Title**: [Brief description of the issue]
**Severity**: Critical/High/Medium/Low
**Priority**: P1/P2/P3/P4
**Test Case**: TC-XXX
**Environment**: Production/Staging
**Browser**: Chrome/Firefox/Safari/Edge
**Device**: Desktop/Mobile

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Videos**:
[Attach evidence]

**Additional Notes**:
[Any additional context]
```

---

## ✅ **ACCEPTANCE CRITERIA CHECKLIST**

### **Critical Functionality**
- [ ] User registration and login work correctly
- [ ] Product catalog displays all products
- [ ] Shopping cart functionality is complete
- [ ] Checkout process completes successfully
- [ ] Orders are created and tracked properly
- [ ] Payment integration works (test mode)
- [ ] Admin panel functions correctly
- [ ] Mobile responsiveness is adequate

### **Performance Criteria**
- [ ] Page load times under 3 seconds
- [ ] No JavaScript errors in console
- [ ] Images load within 2 seconds
- [ ] Forms respond immediately to input

### **Security Criteria**
- [ ] User authentication is secure
- [ ] Session management works correctly
- [ ] No sensitive data exposed in URLs
- [ ] HTTPS is enforced

### **Usability Criteria**
- [ ] Navigation is intuitive
- [ ] Error messages are clear
- [ ] User feedback is immediate
- [ ] Mobile experience is user-friendly

---

## 📋 **FINAL SIGN-OFF**

### **Testing Summary**

**Total Test Cases**: 20
**Passed**: ___
**Failed**: ___
**Blocked**: ___
**Pass Rate**: ___%

### **Overall Assessment**

**Ready for Production**: ✅ Yes / ❌ No

**Comments**:
_[QA Tester comments on overall quality and readiness]_

**Tester Signature**: ________________
**Date**: ________________

**Product Owner Approval**: ________________
**Date**: ________________

---

## 📞 **SUPPORT CONTACTS**

- **Development Team**: [Contact information]
- **Product Owner**: [Contact information]
- **QA Lead**: [Contact information]
- **Technical Support**: [Contact information]

---

**Document End**

*This Acceptance Testing Plan ensures comprehensive validation of the Print-on-Demand platform's core functionality through systematic manual testing of the complete user journey.*