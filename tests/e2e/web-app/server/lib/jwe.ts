import { logger } from '@packages/logger'
import crypto from 'crypto'
import config from '../config'

// The key must be 32 bytes (256 bits) for AES-256
const key = Buffer.from(config.auth.jweKey)

/**
 * Decrypts the given JWE token.
 */
export function decryptJwe(encryptedBase64: string): string | null {
  const inputBuffer = Buffer.from(encryptedBase64, 'base64')

  // The IV is the first 12 bytes
  const iv = inputBuffer.subarray(0, 12)
  // The Auth Tag is the next 16 bytes (default GCM tag length is 16 bytes)
  const authTag = inputBuffer.subarray(12, 28)

  // The Ciphertext is the remainder of the buffer
  const ciphertext = inputBuffer.subarray(28).toString('base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  // Set the authentication tag before decryption
  decipher.setAuthTag(authTag)

  let plaintext = decipher.update(ciphertext, 'base64', 'utf8')
  try {
    plaintext += decipher.final('utf8')
  } catch (error) {
    // If the authentication fails (e.g., tampered data), an 'ERR_CRYPTO_INVALID_AUTH_TAG' error is thrown
    logger.error('Decryption failed: Invalid authentication tag')
    return null
  }

  return plaintext
}
