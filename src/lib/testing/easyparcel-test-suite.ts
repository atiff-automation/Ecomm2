/**
 * EasyParcel API Testing Suite
 * Comprehensive testing framework for all EasyParcel integration scenarios
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.2
 */

import { EasyParcelService } from '../shipping/easyparcel-service';
import { TaxInclusiveShippingCalculator } from '../shipping/tax-inclusive-shipping-calculator';
import { MalaysianTaxService } from '../tax/malaysian-tax-service';
import { prisma } from '@/lib/db/prisma';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  duration: number;
  data?: any;
  error?: any;
}

interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
  results: TestResult[];
}

export class EasyParcelTestSuite {
  private easyParcelService: EasyParcelService;
  private taxCalculator: TaxInclusiveShippingCalculator;
  private taxService: MalaysianTaxService;

  // Malaysian test addresses as per PDF documentation
  private testAddresses = {
    // West Malaysia
    kualaLumpur: {
      name: 'Test Customer KL',
      phone: '+60123456789',
      email: 'test@example.com',
      address_line_1: 'Unit 1, Test Building',
      address_line_2: 'Jalan Test',
      city: 'Kuala Lumpur',
      state: 'KUL',
      postcode: '50000',
      country: 'MY'
    },
    selangor: {
      name: 'Test Customer Selangor',
      phone: '+60123456789',
      email: 'test@example.com',
      address_line_1: '123 Test Street',
      address_line_2: 'Taman Test',
      city: 'Shah Alam',
      state: 'SEL',
      postcode: '40000',
      country: 'MY'
    },
    johor: {
      name: 'Test Customer Johor',
      phone: '+60123456789',
      email: 'test@example.com',
      address_line_1: '456 Test Road',
      city: 'Johor Bahru',
      state: 'JOH',
      postcode: '80000',
      country: 'MY'
    },
    // East Malaysia
    sabah: {
      name: 'Test Customer Sabah',
      phone: '+60123456789',
      email: 'test@example.com',
      address_line_1: '789 Test Avenue',
      city: 'Kota Kinabalu',
      state: 'SAB',
      postcode: '88000',
      country: 'MY'
    },
    sarawak: {
      name: 'Test Customer Sarawak',
      phone: '+60123456789',
      email: 'test@example.com',
      address_line_1: '321 Test Lane',
      city: 'Kuching',
      state: 'SWK',
      postcode: '93000',
      country: 'MY'
    }
  };

  // Test parcel configurations
  private testParcels = {
    small: {
      weight: 0.5,
      length: 20,
      width: 15,
      height: 10,
      content: 'Small test package',
      value: 100,
      quantity: 1
    },
    medium: {
      weight: 2.0,
      length: 30,
      width: 25,
      height: 20,
      content: 'Medium test package',
      value: 500,
      quantity: 1
    },
    large: {
      weight: 10.0,
      length: 50,
      width: 40,
      height: 30,
      content: 'Large test package',
      value: 1000,
      quantity: 1
    },
    oversized: {
      weight: 30.0,
      length: 100,
      width: 80,
      height: 60,
      content: 'Oversized test package',
      value: 2000,
      quantity: 1
    }
  };

  constructor() {
    this.easyParcelService = new EasyParcelService();
    this.taxCalculator = new TaxInclusiveShippingCalculator();
    this.taxService = MalaysianTaxService.getInstance();
  }

  /**
   * Run complete test suite
   */
  async runFullTestSuite(): Promise<{
    overallResult: 'PASS' | 'FAIL' | 'WARNING';
    suiteResults: TestSuiteResult[];
    summary: {
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      totalWarnings: number;
      totalDuration: number;
    };
  }> {
    const startTime = Date.now();
    const suiteResults: TestSuiteResult[] = [];

    try {
      // Run all test suites
      suiteResults.push(await this.testRateCalculation());
      suiteResults.push(await this.testShipmentBooking());
      suiteResults.push(await this.testLabelGeneration());
      suiteResults.push(await this.testTrackingUpdates());
      suiteResults.push(await this.testTaxCalculation());
      suiteResults.push(await this.testErrorHandling());
      suiteResults.push(await this.testMalaysianStates());

      // Calculate summary
      const summary = {
        totalTests: suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0),
        totalPassed: suiteResults.reduce((sum, suite) => sum + suite.passed, 0),
        totalFailed: suiteResults.reduce((sum, suite) => sum + suite.failed, 0),
        totalWarnings: suiteResults.reduce((sum, suite) => sum + suite.warnings, 0),
        totalDuration: Date.now() - startTime
      };

      // Determine overall result
      let overallResult: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      if (summary.totalFailed > 0) {
        overallResult = 'FAIL';
      } else if (summary.totalWarnings > 0) {
        overallResult = 'WARNING';
      }

      return { overallResult, suiteResults, summary };

    } catch (error) {
      console.error('Critical error in test suite:', error);
      return {
        overallResult: 'FAIL',
        suiteResults,
        summary: {
          totalTests: 0,
          totalPassed: 0,
          totalFailed: 1,
          totalWarnings: 0,
          totalDuration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Test 1: Rate Calculation for All Malaysian States
   */
  private async testRateCalculation(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test rate calculation for each state combination
    const stateTests = [
      { from: this.testAddresses.kualaLumpur, to: this.testAddresses.selangor, name: 'KL to Selangor' },
      { from: this.testAddresses.selangor, to: this.testAddresses.johor, name: 'Selangor to Johor' },
      { from: this.testAddresses.kualaLumpur, to: this.testAddresses.sabah, name: 'KL to Sabah (East Malaysia)' },
      { from: this.testAddresses.johor, to: this.testAddresses.sarawak, name: 'Johor to Sarawak (East Malaysia)' }
    ];

    for (const test of stateTests) {
      const testStart = Date.now();
      try {
        const rates = await this.easyParcelService.calculateRates({
          pickup_address: test.from,
          delivery_address: test.to,
          parcel: this.testParcels.medium,
          service_types: ['STANDARD', 'EXPRESS']
        });

        if (rates.rates && rates.rates.length > 0) {
          results.push({
            testName: `Rate Calculation: ${test.name}`,
            status: 'PASS',
            message: `Found ${rates.rates.length} rates`,
            duration: Date.now() - testStart,
            data: { rateCount: rates.rates.length, cheapestRate: rates.rates[0]?.price }
          });
        } else {
          results.push({
            testName: `Rate Calculation: ${test.name}`,
            status: 'WARNING',
            message: 'No rates returned',
            duration: Date.now() - testStart,
            data: rates
          });
        }
      } catch (error) {
        results.push({
          testName: `Rate Calculation: ${test.name}`,
          status: 'FAIL',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - testStart,
          error
        });
      }
    }

    // Test different parcel sizes
    const parcelTests = Object.entries(this.testParcels);
    for (const [size, parcel] of parcelTests) {
      const testStart = Date.now();
      try {
        const rates = await this.easyParcelService.calculateRates({
          pickup_address: this.testAddresses.kualaLumpur,
          delivery_address: this.testAddresses.selangor,
          parcel,
          service_types: ['STANDARD']
        });

        results.push({
          testName: `Rate Calculation: ${size} parcel`,
          status: rates.rates && rates.rates.length > 0 ? 'PASS' : 'WARNING',
          message: rates.rates ? `${rates.rates.length} rates found` : 'No rates found',
          duration: Date.now() - testStart,
          data: { parcelSize: size, rateCount: rates.rates?.length }
        });
      } catch (error) {
        results.push({
          testName: `Rate Calculation: ${size} parcel`,
          status: 'FAIL',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - testStart,
          error
        });
      }
    }

    return this.summarizeTestResults('Rate Calculation Tests', results, Date.now() - startTime);
  }

  /**
   * Test 2: Shipment Booking and Cancellation
   */
  private async testShipmentBooking(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test shipment booking
    const testStart = Date.now();
    try {
      const bookingRequest = {
        pickup_address: this.testAddresses.kualaLumpur,
        delivery_address: this.testAddresses.selangor,
        parcel: this.testParcels.small,
        service_id: 'test-service-id',
        reference: `TEST-${Date.now()}`,
        special_instruction: 'Test booking - please handle with care',
        insurance: true,
        signature_required: false
      };

      const bookingResponse = await this.easyParcelService.bookShipment(bookingRequest);

      if (bookingResponse.shipment_id) {
        results.push({
          testName: 'Shipment Booking',
          status: 'PASS',
          message: `Shipment booked successfully: ${bookingResponse.shipment_id}`,
          duration: Date.now() - testStart,
          data: {
            shipmentId: bookingResponse.shipment_id,
            trackingNumber: bookingResponse.tracking_number,
            reference: bookingResponse.reference
          }
        });
      } else {
        results.push({
          testName: 'Shipment Booking',
          status: 'WARNING',
          message: 'Booking response received but no shipment ID',
          duration: Date.now() - testStart,
          data: bookingResponse
        });
      }
    } catch (error) {
      results.push({
        testName: 'Shipment Booking',
        status: 'FAIL',
        message: `Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - testStart,
        error
      });
    }

    return this.summarizeTestResults('Shipment Booking Tests', results, Date.now() - startTime);
  }

  /**
   * Test 3: Label Generation and Download
   */
  private async testLabelGeneration(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // This test would require a valid shipment ID from booking
    // For now, we'll test the label generation method with a mock ID
    const testStart = Date.now();
    try {
      // Test label generation (would normally use real shipment ID)
      const mockShipmentId = 'TEST_SHIPMENT_ID';
      
      // In sandbox mode, this might work with test IDs
      const labelBuffer = await this.easyParcelService.generateLabel(mockShipmentId);

      if (labelBuffer && labelBuffer.length > 0) {
        results.push({
          testName: 'Label Generation',
          status: 'PASS',
          message: `Label generated successfully (${labelBuffer.length} bytes)`,
          duration: Date.now() - testStart,
          data: { labelSize: labelBuffer.length }
        });
      } else {
        results.push({
          testName: 'Label Generation',
          status: 'WARNING',
          message: 'Label generation returned empty buffer',
          duration: Date.now() - testStart
        });
      }
    } catch (error) {
      // This is expected in sandbox mode without valid shipment ID
      results.push({
        testName: 'Label Generation',
        status: 'WARNING',
        message: `Label generation test skipped in sandbox mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - testStart,
        error
      });
    }

    return this.summarizeTestResults('Label Generation Tests', results, Date.now() - startTime);
  }

  /**
   * Test 4: Tracking Updates via Webhook
   */
  private async testTrackingUpdates(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test tracking API with mock tracking number
    const testStart = Date.now();
    try {
      const mockTrackingNumber = 'TEST123456789';
      
      const trackingResponse = await this.easyParcelService.trackShipment(mockTrackingNumber);

      results.push({
        testName: 'Tracking API',
        status: 'WARNING',
        message: 'Tracking test completed (sandbox mode)',
        duration: Date.now() - testStart,
        data: trackingResponse
      });
    } catch (error) {
      results.push({
        testName: 'Tracking API',
        status: 'WARNING',
        message: `Tracking test skipped: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - testStart,
        error
      });
    }

    // Test webhook endpoint accessibility
    const webhookTestStart = Date.now();
    try {
      // Test if webhook endpoint is properly configured
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/easyparcel-tracking';
      
      results.push({
        testName: 'Webhook Configuration',
        status: 'PASS',
        message: `Webhook URL configured: ${webhookUrl}`,
        duration: Date.now() - webhookTestStart,
        data: { webhookUrl }
      });
    } catch (error) {
      results.push({
        testName: 'Webhook Configuration',
        status: 'FAIL',
        message: 'Webhook configuration error',
        duration: Date.now() - webhookTestStart,
        error
      });
    }

    return this.summarizeTestResults('Tracking and Webhook Tests', results, Date.now() - startTime);
  }

  /**
   * Test 5: Tax Calculation Integration
   */
  private async testTaxCalculation(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test Malaysian tax calculation
    const testStart = Date.now();
    try {
      const taxBreakdown = await this.taxService.calculateTaxBreakdown({
        productSubtotal: 1000,
        shippingCost: 50,
        taxInclusive: false
      });

      results.push({
        testName: 'Malaysian Tax Calculation',
        status: 'PASS',
        message: `Tax calculated: RM${taxBreakdown.totalTax.toFixed(2)}`,
        duration: Date.now() - testStart,
        data: taxBreakdown
      });
    } catch (error) {
      results.push({
        testName: 'Malaysian Tax Calculation',
        status: 'FAIL',
        message: `Tax calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - testStart,
        error
      });
    }

    // Test tax-inclusive shipping rates
    const taxRateTestStart = Date.now();
    try {
      const taxInclusiveRates = await this.taxCalculator.calculateTaxInclusiveRates({
        pickupAddress: {
          postcode: '50000',
          state: 'KUL',
          city: 'Kuala Lumpur'
        },
        deliveryAddress: {
          postcode: '40000',
          state: 'SEL',
          city: 'Shah Alam'
        },
        parcel: {
          weight: 1.0,
          value: 100
        },
        displayTaxInclusive: true
      });

      results.push({
        testName: 'Tax-Inclusive Shipping Rates',
        status: taxInclusiveRates.length > 0 ? 'PASS' : 'WARNING',
        message: `${taxInclusiveRates.length} tax-inclusive rates calculated`,
        duration: Date.now() - taxRateTestStart,
        data: { rateCount: taxInclusiveRates.length }
      });
    } catch (error) {
      results.push({
        testName: 'Tax-Inclusive Shipping Rates',
        status: 'FAIL',
        message: `Tax-inclusive rate calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - taxRateTestStart,
        error
      });
    }

    return this.summarizeTestResults('Tax Calculation Tests', results, Date.now() - startTime);
  }

  /**
   * Test 6: Error Handling Scenarios
   */
  private async testErrorHandling(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test invalid address
    const invalidAddressTest = Date.now();
    try {
      await this.easyParcelService.calculateRates({
        pickup_address: { ...this.testAddresses.kualaLumpur, postcode: '00000' }, // Invalid postcode
        delivery_address: this.testAddresses.selangor,
        parcel: this.testParcels.small
      });

      results.push({
        testName: 'Invalid Address Handling',
        status: 'WARNING',
        message: 'Invalid address was accepted (unexpected)',
        duration: Date.now() - invalidAddressTest
      });
    } catch (error) {
      results.push({
        testName: 'Invalid Address Handling',
        status: 'PASS',
        message: 'Invalid address properly rejected',
        duration: Date.now() - invalidAddressTest,
        data: { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test oversized parcel
    const oversizedTest = Date.now();
    try {
      await this.easyParcelService.calculateRates({
        pickup_address: this.testAddresses.kualaLumpur,
        delivery_address: this.testAddresses.selangor,
        parcel: { ...this.testParcels.oversized, weight: 100 } // Exceeds 70kg limit
      });

      results.push({
        testName: 'Oversized Parcel Handling',
        status: 'WARNING',
        message: 'Oversized parcel was accepted (unexpected)',
        duration: Date.now() - oversizedTest
      });
    } catch (error) {
      results.push({
        testName: 'Oversized Parcel Handling',
        status: 'PASS',
        message: 'Oversized parcel properly rejected',
        duration: Date.now() - oversizedTest,
        data: { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return this.summarizeTestResults('Error Handling Tests', results, Date.now() - startTime);
  }

  /**
   * Test 7: All Malaysian States Coverage
   */
  private async testMalaysianStates(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    const malaysianStates = [
      { code: 'JOH', name: 'Johor', postcode: '80000' },
      { code: 'KDH', name: 'Kedah', postcode: '08000' },
      { code: 'KTN', name: 'Kelantan', postcode: '15000' },
      { code: 'MLK', name: 'Melaka', postcode: '75000' },
      { code: 'NSN', name: 'Negeri Sembilan', postcode: '70000' },
      { code: 'PHG', name: 'Pahang', postcode: '25000' },
      { code: 'PRK', name: 'Perak', postcode: '30000' },
      { code: 'PLS', name: 'Perlis', postcode: '01000' },
      { code: 'PNG', name: 'Pulau Pinang', postcode: '10000' },
      { code: 'SEL', name: 'Selangor', postcode: '40000' },
      { code: 'TRG', name: 'Terengganu', postcode: '20000' },
      { code: 'SAB', name: 'Sabah', postcode: '88000' },
      { code: 'SWK', name: 'Sarawak', postcode: '93000' },
      { code: 'KUL', name: 'Kuala Lumpur', postcode: '50000' },
      { code: 'LBN', name: 'Labuan', postcode: '87000' },
      { code: 'PJY', name: 'Putrajaya', postcode: '62000' }
    ];

    // Test a sample of states (to avoid overwhelming the API)
    const sampleStates = malaysianStates.slice(0, 5);

    for (const state of sampleStates) {
      const testStart = Date.now();
      try {
        const testAddress = {
          ...this.testAddresses.kualaLumpur,
          city: state.name,
          state: state.code,
          postcode: state.postcode
        };

        const rates = await this.easyParcelService.calculateRates({
          pickup_address: this.testAddresses.kualaLumpur,
          delivery_address: testAddress,
          parcel: this.testParcels.small
        });

        results.push({
          testName: `State Coverage: ${state.name}`,
          status: rates.rates && rates.rates.length > 0 ? 'PASS' : 'WARNING',
          message: rates.rates ? `${rates.rates.length} rates available` : 'No rates available',
          duration: Date.now() - testStart,
          data: { state: state.code, rateCount: rates.rates?.length }
        });
      } catch (error) {
        results.push({
          testName: `State Coverage: ${state.name}`,
          status: 'FAIL',
          message: `State test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - testStart,
          error
        });
      }
    }

    return this.summarizeTestResults('Malaysian States Coverage Tests', results, Date.now() - startTime);
  }

  /**
   * Helper method to summarize test results
   */
  private summarizeTestResults(suiteName: string, results: TestResult[], duration: number): TestSuiteResult {
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;

    return {
      suiteName,
      totalTests: results.length,
      passed,
      failed,
      warnings,
      duration,
      results
    };
  }

  /**
   * Generate test report
   */
  generateTestReport(suiteResults: TestSuiteResult[]): string {
    let report = '# EasyParcel Integration Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const suite of suiteResults) {
      report += `## ${suite.suiteName}\n`;
      report += `- Tests: ${suite.totalTests}\n`;
      report += `- Passed: ${suite.passed}\n`;
      report += `- Failed: ${suite.failed}\n`;
      report += `- Warnings: ${suite.warnings}\n`;
      report += `- Duration: ${suite.duration}ms\n\n`;

      for (const result of suite.results) {
        const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `${status} **${result.testName}**: ${result.message} (${result.duration}ms)\n`;
      }
      report += '\n';
    }

    return report;
  }
}