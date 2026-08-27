/**
 * The children of the head tag such as Script tags, Link tags, etc...
 */
export const HtmlHeadChildren = () => {
  return (
    <>
      <meta charSet='utf-8' />
      <link rel='icon' href='https://localhost:443/static/favicon.ico' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <meta
        name='description'
        content='Demo website showcasing the apollo client state synchronization and graphql-over-shared-ws across browsing contexts.'
      />
      <title>Demo of Apollo Client State Sync and graphql-shared-ws</title>
      <link
        href='https://fonts.googleapis.com/css?family=Roboto'
        rel='stylesheet'
        type='text/css'
      />
      <script src='https://apis.google.com/js/api:client.js'></script>
    </>
  )
}
