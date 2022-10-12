import { Component } from 'react'

import { Button, ButtonType, IconArrow } from '@coliving/stems'
import { mapValues } from 'lodash'
import PropTypes from 'prop-types'

import FormTile from 'components/dataEntry/formTile'
import InlineFormTile from 'components/dataEntry/inlineFormTile'

import styles from './editPage.module.css'
import UploadType from './uploadType'

class EditPage extends Component {
  state = {
    invalidDigitalContentsFields: this.props.digitalContents.map((digital_content) =>
      mapValues(digital_content.metadata, (v) => false)
    ),
    invalidCollectionFields: mapValues(this.props.metadata, (v) => false)
  }

  componentWillUnmount() {
    this.props.onStopPreview()
  }

  getRequiredDigitalContentsFields = (digitalContents) => {
    return this.props.digitalContents.map((digital_content) => {
      const fields = mapValues(digital_content.metadata, (v) => false)
      fields.title = true
      if (
        this.props.uploadType === UploadType.INDIVIDUAL_AGREEMENT ||
        this.props.uploadType === UploadType.INDIVIDUAL_AGREEMENTS
      ) {
        fields.genre = true
        fields.artwork = true
      }
      return fields
    })
  }

  getRequiredCollectionFields = (metadata) => {
    const fields = mapValues(metadata, (v) => false)
    fields.content_list_name = true
    fields.genre = true
    fields.artwork = true
    return fields
  }

  validateDigitalContentsFields = (digitalContents) => {
    const { uploadType } = this.props

    const newInvalidDigitalContentsFields = [...this.state.invalidDigitalContentsFields]
    const validDigitalContents = digitalContents.map((digital_content, i) => {
      newInvalidDigitalContentsFields[i] = {
        ...this.state.invalidDigitalContentsFields[i],
        title: !digital_content.metadata.title
      }
      if (
        uploadType === UploadType.INDIVIDUAL_AGREEMENT ||
        uploadType === UploadType.INDIVIDUAL_AGREEMENTS
      ) {
        newInvalidDigitalContentsFields[i].genre = !digital_content.metadata.genre
        newInvalidDigitalContentsFields[i].artwork = !digital_content.metadata.artwork.file
      }
      return Object.values(newInvalidDigitalContentsFields[i]).every((f) => !f)
    })

    this.setState({
      invalidDigitalContentsFields: newInvalidDigitalContentsFields
    })

    const unlistedVisibilityFields = [
      'genre',
      'mood',
      'tags',
      'share',
      'play_count'
    ]
    for (let i = 0; i < digitalContents.length; i += 1) {
      const digital_content = digitalContents[i]
      // If digital_content is not unlisted (is public) and one of the unlisted visibility fields is false, set to true
      if (
        !digital_content.metadata.is_unlisted &&
        !unlistedVisibilityFields.every(
          (field) => digital_content.metadata.field_visibility[field]
        )
      ) {
        this.updateDigitalContent(
          'field_visibility',
          {
            genre: true,
            mood: true,
            tags: true,
            share: true,
            play_count: true,
            remixes: digital_content.metadata.field_visibility.remixes
          },
          false,
          i
        )
      }
    }
    return validDigitalContents.every((f) => f)
  }

  validateCollectionFields = (formFields) => {
    const newInvalidCollectionFields = {
      ...this.state.invalidCollectionFields,
      content_list_name: !formFields.content_list_name,
      genre: !formFields.genre,
      artwork: !formFields.artwork.file
    }
    this.setState({
      invalidCollectionFields: newInvalidCollectionFields
    })
    return Object.values(newInvalidCollectionFields).every((f) => !f)
  }

  onContinue = () => {
    const { uploadType } = this.props

    let validCollectionFields = true
    if (uploadType === UploadType.CONTENT_LIST || uploadType === UploadType.ALBUM) {
      validCollectionFields = this.validateCollectionFields(this.props.metadata)
    }
    const validDigitalContentsFields = this.validateDigitalContentsFields(this.props.digitalContents)
    if (validDigitalContentsFields && validCollectionFields) {
      this.props.onContinue()
    }
  }

  updateMetadata = (field, value, invalid) => {
    const { invalidCollectionFields } = this.state
    invalidCollectionFields[field] = !!invalid
    this.setState({ invalidCollectionFields })
    this.props.updateMetadata(field, value)
  }

  updateDigitalContent = (field, value, invalid, i) => {
    const { invalidDigitalContentsFields } = this.state
    invalidDigitalContentsFields[i][field] = !!invalid
    this.setState({ invalidDigitalContentsFields })
    this.props.updateDigitalContent(field, value, i)
  }

  render() {
    const {
      metadata,
      digitalContents,
      uploadType,
      previewIndex,
      onPlayPreview,
      onStopPreview,
      onChangeOrder
    } = this.props

    const { invalidDigitalContentsFields, invalidCollectionFields } = this.state

    const requiredDigitalContentsFields = this.getRequiredDigitalContentsFields(this.props.digitalContents)
    const requiredCollectionFields = this.getRequiredCollectionFields(
      this.props.metadata
    )

    let forms
    if (uploadType === UploadType.CONTENT_LIST || uploadType === UploadType.ALBUM) {
      forms = (
        <div className={styles.formTile}>
          <FormTile
            defaultFields={metadata}
            invalidFields={invalidCollectionFields}
            requiredFields={requiredCollectionFields}
            isContentList
            type={uploadType === UploadType.CONTENT_LIST ? 'contentList' : 'album'}
            onChangeField={(field, value, invalid) =>
              this.updateMetadata(field, value, invalid)
            }
            onChangeOrder={(source, destination) =>
              onChangeOrder(source, destination)
            }
          >
            {digitalContents.map((digital_content, i) => (
              <InlineFormTile
                key={i}
                defaultFields={digital_content.metadata}
                invalidFields={invalidDigitalContentsFields[i]}
                requiredFields={requiredDigitalContentsFields[i]}
                playing={i === previewIndex}
                onPlayPreview={() => onPlayPreview(i)}
                onStopPreview={() => onStopPreview()}
                onChangeField={(field, value, invalid = false) =>
                  this.updateDigitalContent(field, value, invalid, i)
                }
              />
            ))}
          </FormTile>
        </div>
      )
    } else {
      forms = digitalContents.map((digital_content, i) => (
        <div key={digital_content.file.preview + i} className={styles.formTile}>
          <FormTile
            defaultFields={digital_content.metadata}
            invalidFields={invalidDigitalContentsFields[i]}
            requiredFields={requiredDigitalContentsFields[i]}
            playing={i === previewIndex}
            type={'digital_content'}
            onAddStems={(stems) => this.props.onAddStems(stems, i)}
            onSelectStemCategory={(category, stemIndex) =>
              this.props.onSelectStemCategory(category, i, stemIndex)
            }
            onDeleteStem={(stemIndex) => this.props.onDeleteStem(i, stemIndex)}
            stems={this.props.stems[i]}
            onPlayPreview={() => onPlayPreview(i)}
            onStopPreview={() => onStopPreview()}
            onChangeField={(field, value, invalid) =>
              this.updateDigitalContent(field, value, invalid, i)
            }
          />
        </div>
      ))
    }

    return (
      <div className={styles.edit}>
        {forms}
        <div className={styles.continue}>
          <Button
            type={ButtonType.PRIMARY_ALT}
            text='Continue'
            name='continue'
            rightIcon={<IconArrow />}
            onClick={this.onContinue}
            textClassName={styles.continueButtonText}
            className={styles.continueButton}
          />
        </div>
      </div>
    )
  }
}

EditPage.propTypes = {
  digitalContents: PropTypes.array,
  uploadType: PropTypes.oneOf(Object.values(UploadType)),
  previewIndex: PropTypes.number,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func,
  updateDigitalContent: PropTypes.func,
  updateMetadata: PropTypes.func,
  onContinue: PropTypes.func,
  onAddStems: PropTypes.func,
  stems: PropTypes.array,

  /** Function of type (digitalContentIndex, stemIndex) => void */
  onDeleteStem: PropTypes.func
}

export default EditPage
