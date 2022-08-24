import { Component } from 'react'

import { Button, ButtonType, IconArrow } from '@coliving/stems'
import { mapValues } from 'lodash'
import PropTypes from 'prop-types'

import FormTile from 'components/data-entry/FormTile'
import InlineFormTile from 'components/data-entry/InlineFormTile'

import styles from './EditPage.module.css'
import UploadType from './uploadType'

class EditPage extends Component {
  state = {
    invalidAgreementsFields: this.props.agreements.map((agreement) =>
      mapValues(agreement.metadata, (v) => false)
    ),
    invalidCollectionFields: mapValues(this.props.metadata, (v) => false)
  }

  componentWillUnmount() {
    this.props.onStopPreview()
  }

  getRequiredAgreementsFields = (agreements) => {
    return this.props.agreements.map((agreement) => {
      const fields = mapValues(agreement.metadata, (v) => false)
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

  validateAgreementsFields = (agreements) => {
    const { uploadType } = this.props

    const newInvalidAgreementsFields = [...this.state.invalidAgreementsFields]
    const validAgreements = agreements.map((agreement, i) => {
      newInvalidAgreementsFields[i] = {
        ...this.state.invalidAgreementsFields[i],
        title: !agreement.metadata.title
      }
      if (
        uploadType === UploadType.INDIVIDUAL_AGREEMENT ||
        uploadType === UploadType.INDIVIDUAL_AGREEMENTS
      ) {
        newInvalidAgreementsFields[i].genre = !agreement.metadata.genre
        newInvalidAgreementsFields[i].artwork = !agreement.metadata.artwork.file
      }
      return Object.values(newInvalidAgreementsFields[i]).every((f) => !f)
    })

    this.setState({
      invalidAgreementsFields: newInvalidAgreementsFields
    })

    const unlistedVisibilityFields = [
      'genre',
      'mood',
      'tags',
      'share',
      'play_count'
    ]
    for (let i = 0; i < agreements.length; i += 1) {
      const agreement = agreements[i]
      // If agreement is not unlisted (is public) and one of the unlisted visibility fields is false, set to true
      if (
        !agreement.metadata.is_unlisted &&
        !unlistedVisibilityFields.every(
          (field) => agreement.metadata.field_visibility[field]
        )
      ) {
        this.updateAgreement(
          'field_visibility',
          {
            genre: true,
            mood: true,
            tags: true,
            share: true,
            play_count: true,
            remixes: agreement.metadata.field_visibility.remixes
          },
          false,
          i
        )
      }
    }
    return validAgreements.every((f) => f)
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
    const validAgreementsFields = this.validateAgreementsFields(this.props.agreements)
    if (validAgreementsFields && validCollectionFields) {
      this.props.onContinue()
    }
  }

  updateMetadata = (field, value, invalid) => {
    const { invalidCollectionFields } = this.state
    invalidCollectionFields[field] = !!invalid
    this.setState({ invalidCollectionFields })
    this.props.updateMetadata(field, value)
  }

  updateAgreement = (field, value, invalid, i) => {
    const { invalidAgreementsFields } = this.state
    invalidAgreementsFields[i][field] = !!invalid
    this.setState({ invalidAgreementsFields })
    this.props.updateAgreement(field, value, i)
  }

  render() {
    const {
      metadata,
      agreements,
      uploadType,
      previewIndex,
      onPlayPreview,
      onStopPreview,
      onChangeOrder
    } = this.props

    const { invalidAgreementsFields, invalidCollectionFields } = this.state

    const requiredAgreementsFields = this.getRequiredAgreementsFields(this.props.agreements)
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
            {agreements.map((agreement, i) => (
              <InlineFormTile
                key={i}
                defaultFields={agreement.metadata}
                invalidFields={invalidAgreementsFields[i]}
                requiredFields={requiredAgreementsFields[i]}
                playing={i === previewIndex}
                onPlayPreview={() => onPlayPreview(i)}
                onStopPreview={() => onStopPreview()}
                onChangeField={(field, value, invalid = false) =>
                  this.updateAgreement(field, value, invalid, i)
                }
              />
            ))}
          </FormTile>
        </div>
      )
    } else {
      forms = agreements.map((agreement, i) => (
        <div key={agreement.file.preview + i} className={styles.formTile}>
          <FormTile
            defaultFields={agreement.metadata}
            invalidFields={invalidAgreementsFields[i]}
            requiredFields={requiredAgreementsFields[i]}
            playing={i === previewIndex}
            type={'agreement'}
            onAddStems={(stems) => this.props.onAddStems(stems, i)}
            onSelectStemCategory={(category, stemIndex) =>
              this.props.onSelectStemCategory(category, i, stemIndex)
            }
            onDeleteStem={(stemIndex) => this.props.onDeleteStem(i, stemIndex)}
            stems={this.props.stems[i]}
            onPlayPreview={() => onPlayPreview(i)}
            onStopPreview={() => onStopPreview()}
            onChangeField={(field, value, invalid) =>
              this.updateAgreement(field, value, invalid, i)
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
  agreements: PropTypes.array,
  uploadType: PropTypes.oneOf(Object.values(UploadType)),
  previewIndex: PropTypes.number,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func,
  updateAgreement: PropTypes.func,
  updateMetadata: PropTypes.func,
  onContinue: PropTypes.func,
  onAddStems: PropTypes.func,
  stems: PropTypes.array,

  /** Function of type (agreementIndex, stemIndex) => void */
  onDeleteStem: PropTypes.func
}

export default EditPage
