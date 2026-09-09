/** Checks whether a blob URL is syntactically valid and accessible. */
export const isBlobUrlValid = async (url: string | URL): Promise<boolean> => {
  try {
    // A URL can remain in Local Storage after its blob has been revoked.
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'blob:') {
      throw new Error('Invalid URL protocol. Expected blob:')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Blob URL cannot be accessed.')
    }
    return true
  } catch (error) {
    console.error('Blob URL validation failed:', error)
    // Release the URL when it is no longer usable in this context.
    URL.revokeObjectURL(url.toString())
    return false
  }
}
