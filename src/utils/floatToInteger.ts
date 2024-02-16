/**
 * Returns comma separated integer parsing a string floating point number
 */
export function floatStringToInteger(number: string) {
  return parseFloat(number).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}
