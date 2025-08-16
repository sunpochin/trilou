export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Fetch lists that belong to the current user.
  // IMPORTANT: I'm assuming your 'lists' table has a 'user_id' column.
  // If your column is named differently, please change '.eq('user_id', ...)' accordingly.
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching lists:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching lists',
    })
  }

  return data
})
