/**
 * SEO Utlity functions to generate titles and descriptions
 */

export const getAgreementPageTitle = ({
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

type getAgreementPageDescriptionProps = {
  releaseDate: string
  duration: string
  tags: string[]
  genre: string
  mood: string
  description: string
}
export const getAgreementPageDescription = ({
  releaseDate,
  tags,
  duration,
  genre,
  mood,
  description
}: getAgreementPageDescriptionProps) => {
  // Note, release date and duration will be defined if the agreement metadata is fetched.
  if (!releaseDate) return ''
  const tagText =
    Array.isArray(tags) && tags.length > 0 ? ` | Tags: ${tags.join(', ')}` : ''
  const genreText = genre ? ` | Genre: ${genre}` : ''
  const durationText = duration ? ` | Duration: ${duration}` : ''
  const moodText = mood ? ` | Mood: ${mood}` : ''
  const descriptionText = description ? ` | ${description}` : ''
  return `Released: ${releaseDate}${genreText}${moodText}${durationText}${tagText}${descriptionText}`
}
