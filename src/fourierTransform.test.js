import { ifft } from './fourierTransform';
import { fft } from './fft';

describe('IFFT function', () => {
  test('should correctly perform IFFT on a simple input', () => {
    // Test case 1: Simple input
    const real = [1, 0, -1, 0];
    const imag = [0, 1, 0, -1];
    
    const result = ifft(real, imag);
    // Expected output (approximately)
    const expectedReal = [0, 0, 0, 1];
    const expectedImag = [0, 0, 0, 0];

    // Check if the result matches the expected output
    expect(result.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(result[i][0]).toBeCloseTo(expectedReal[i], 2);
      expect(result[i][1]).toBeCloseTo(expectedImag[i], 2);
    }
    });
  
  test('should correctly perform IFFT on a normal input', () => {
      // Test case 1: Simple input
      const input = [1,1,1,1,0,0,0,0];

      let transformedInput = fft(input);
      let real = transformedInput.map(x => x.re);
      let imag = transformedInput.map(x => x.im);
      
      const result = ifft(real, imag);
  
      console.log(result);

  
      // Check if the result matches the expected output
      expect(result.length).toBe(8);
      for (let i = 0; i < 4; i++) {
        expect(result[i][0]).toBeCloseTo([1,1,1,1,0,0,0,0][i], 2);
        expect(result[i][1]).toBeCloseTo(0, 2);
      }
    });

  test('should handle single-element input', () => {
    // Test case 2: Single element input
    const real = [5];
    const imag = [3];

    const result = ifft(real, imag);

    expect(result).toEqual([[5, 3]]);
  });

  test('should handle zero input', () => {
    // Test case 3: Zero input
    const real = [0, 0, 0, 0];
    const imag = [0, 0, 0, 0];

    const result = ifft(real, imag);

    expect(result.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(result[i][0]).toBeCloseTo(0, 5);
      expect(result[i][1]).toBeCloseTo(0, 5);
    }
  });
});

