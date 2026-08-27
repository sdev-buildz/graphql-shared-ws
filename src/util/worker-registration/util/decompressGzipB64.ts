/**
 * Decompresses the given GZIP-compressed base64 string.
 */
export async function decompressGzipString(base64Str: string): Promise<string> {
  try {
    // 1. Convert base64 string to binary array
    const binaryString = atob(base64Str)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 2. Stream into native browser DecompressionStream
    const ds = new DecompressionStream('gzip')
    const writer = ds.writable.getWriter()
    writer.write(bytes)
    writer.close()

    // 3. Read back as text
    const response = new Response(ds.readable)
    return await response.text()
  } catch (error) {
    console.error(error)
    return ''
  }
}
