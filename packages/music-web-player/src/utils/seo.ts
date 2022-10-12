/**
 * SEO Utlity functions to generate titles and descriptions
 */

export const getDigitalContentPageTitle = ({
  title,
  handle
}: {
  title: string
  handle: string
}) => {
  if (!title) return ''
  if (!handle) return title
  return `${title} by ${handle}`
}

type getDigitalContentPageDescriptionProps = {
  releaseDate: string
  duration: string
  tags: string[]
  genre: string
  mood: string
  description: string
}
export const getDigitalContentPageDescription = ({
  releaseDate,
  tags,
  duration,
  genre,
  mood,
  description
}: getDigitalContentPageDescriptionProps) => {
  // Note, release date and duration will be defined if the digital_content metadata is fetched.
  if (!releaseDate) return ''
  const tagText =
    Array.isArray(tags) && tags.length > 0 ? ` | Tags: ${tags.join(', ')}` : ''
  const genreText = genre ? ` | Genre: ${genre}` : ''
  const durationText = duration ? ` | Duration: ${duration}` : ''
  const moodText = mood ? ` | Mood: ${mood}` : ''
  const descriptionText = description ? ` | ${description}` : ''
  return `Released: ${releaseDate}${genreText}${moodText}${durationText}${tagText}${descriptionText}`
}
