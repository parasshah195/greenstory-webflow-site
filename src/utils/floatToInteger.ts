/**
 * Returns comma separated integer parsing a string floating point number
 */
export function floatToInteger(number: number) {
  return number.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}
