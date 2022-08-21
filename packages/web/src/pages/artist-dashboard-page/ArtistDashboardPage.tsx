import { Suspense, Component, useMemo, ReactNode } from 'react'

import { ID, Status, Theme, Agreement, User } from '@coliving/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { each } from 'lodash'
import moment, { Moment } from 'moment'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getTheme } from 'common/store/ui/theme/selectors'
import { formatCount } from 'common/utils/formatUtil'
import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import TableOptionsButton from 'components/agreements-table/TableOptionsButton'
import AgreementsTable, { alphaSortFn } from 'components/agreements-table/AgreementsTable'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'
import { AppState } from 'store/types'
import lazyWithPreload from 'utils/lazyWithPreload'
import { profilePage, TRENDING_PAGE } from 'utils/route'
import { withClassNullGuard } from 'utils/withNullGuard'

import styles from './LandlordDashboardPage.module.css'
import LandlordProfile from './components/LandlordProfile'
import {
  fetchDashboard,
  fetchDashboardListenData,
  resetDashboard
} from './store/actions'
import {
  getDashboardListenData,
  getDashboardStatus,
  makeGetDashboard
} from './store/selectors'

const TotalPlaysChart = lazyWithPreload(
  () => import('./components/TotalPlaysChart')
)

const StatTile = (props: { title: string; value: any }) => {
  return (
    <div className={styles.statTileContainer}>
      <span className={styles.statValue}>{formatCount(props.value)}</span>
      <span className={styles.statTitle}>{props.title}</span>
    </div>
  )
}

const getNumericColumn = (field: any, overrideTitle?: string) => {
  const title = field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()
  return {
    title: overrideTitle || title,
    dataIndex: field,
    key: field,
    className: cn(styles.numericColumn, `col${title}`),
    width: 63,
    sorter: (a: any, b: any) => a[field] - b[field],
    render: (val: any) => formatCount(val)
  }
}

type DataSourceAgreement = Agreement & {
  key: string
  name: string
  date: string
  time?: number
  saves: number
  reposts: number
  plays: number
}

type AgreementsTableProps = {
  onClickRow: (record: any) => void
  unlistedDataSource: DataSourceAgreement[]
  listedDataSource: DataSourceAgreement[]
  account: User
}

export const messages = {
  publicAgreementsTabTitle: 'PUBLIC AGREEMENTS',
  unlistedAgreementsTabTitle: 'HIDDEN AGREEMENTS',
  thisYear: 'This Year'
}

const makeColumns = (account: User, isUnlisted: boolean) => {
  let columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 350,
      className: cn(styles.col, 'colName'),
      sorter: (a: any, b: any) => alphaSortFn(a.name, b.name),
      render: (val: string, record: DataSourceAgreement) => (
        <div className={styles.agreementName}>
          {val}
          {record.is_delete ? ' [Deleted By Landlord]' : ''}
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 50,
      className: cn(styles.col, 'colDate'),
      render: (val: any) => moment(val).format('M/D/YY'),
      sorter: (a: any, b: any) => moment(a.date).diff(moment(b.date))
    },
    getNumericColumn('plays')
  ]

  if (!isUnlisted) {
    columns = [
      ...columns,
      getNumericColumn('saves', 'favorites'),
      getNumericColumn('reposts')
    ]
  }

  const overflowColumn = {
    title: '',
    key: 'optionsButton',
    className: styles.overflowContainer,
    render: (val: any, record: any, index: number) => {
      return (
        <div className={styles.overflowAdjustment}>
          <TableOptionsButton
            isDeleted={record.is_delete}
            includeEdit={false}
            handle={account.handle}
            onClick={(e: any) => e.stopPropagation()}
            agreementId={val.agreement_id}
            isFavorited={val.has_current_user_saved}
            isOwner
            isLandlordPick={account._landlord_pick === val.agreement_id}
            isUnlisted={record.is_unlisted}
            index={index}
            agreementTitle={val.name}
            agreementPermalink={val.permalink}
            hiddenUntilHover={false}
            includeEmbed={!isUnlisted && !record.is_delete}
            includeAddToContentList={!isUnlisted}
            includeLandlordPick={!isUnlisted}
          />
        </div>
      )
    }
  }

  return [...columns, overflowColumn]
}

const AgreementsTableContainer = ({
  onClickRow,
  listedDataSource,
  unlistedDataSource,
  account
}: AgreementsTableProps) => {
  const tabRecalculator = useTabRecalculator()

  const tabHeaders = useMemo(
    () => [
      {
        text: messages.publicAgreementsTabTitle,
        label: messages.publicAgreementsTabTitle
      },
      {
        text: messages.unlistedAgreementsTabTitle,
        label: messages.unlistedAgreementsTabTitle
      }
    ],
    []
  )

  const tabElements = useMemo(
    () => [
      <div
        key='listed'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        <AgreementsTable
          dataSource={listedDataSource}
          limit={5}
          columns={makeColumns(account, false)}
          onClickRow={onClickRow}
          didToggleShowAgreements={() => {
            tabRecalculator.recalculate()
          }}
          animateTransitions={false}
        />
      </div>,
      <div
        key='unlisted'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        <AgreementsTable
          dataSource={unlistedDataSource}
          limit={5}
          columns={makeColumns(account, true)}
          onClickRow={onClickRow}
          didToggleShowAgreements={() => tabRecalculator.recalculate()}
          animateTransitions={false}
        />
      </div>
    ],
    [account, listedDataSource, onClickRow, unlistedDataSource, tabRecalculator]
  )

  const { tabs, body } = useTabs({
    bodyClassName: styles.tabBody,
    isMobile: false,
    tabRecalculator,
    tabs: tabHeaders,
    elements: tabElements
  })

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tabBorderProvider}>
        <div className={styles.tabContainer}>{tabs}</div>
      </div>
      {body}
    </div>
  )
}

type LandlordDashboardPageProps = ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  RouteComponentProps

const mapper = (props: LandlordDashboardPageProps) => {
  const { account } = props
  return { ...props, account }
}

export class LandlordDashboardPage extends Component<
  NonNullable<ReturnType<typeof mapper>>
> {
  state = {
    selectedAgreement: -1 // all agreements
  }

  componentDidMount() {
    this.props.fetchDashboard()
    TotalPlaysChart.preload()
  }

  componentDidUpdate() {
    const agreementCount = this.props.account?.agreement_count || 0
    if (!(agreementCount > 0)) {
      this.props.goToRoute(TRENDING_PAGE)
    }
  }

  componentWillUnmount() {
    this.props.resetDashboard()
  }

  formatMetadata(agreementMetadatas: Agreement[]): DataSourceAgreement[] {
    return agreementMetadatas
      .map((metadata, i) => ({
        ...metadata,
        key: `${metadata.title}_${metadata.dateListened}_${i}`,
        name: metadata.title,
        date: metadata.created_at,
        time: metadata.duration,
        saves: metadata.save_count,
        reposts: metadata.repost_count,
        plays: metadata.play_count
      }))
      .filter((meta) => !meta.is_invalid)
  }

  onClickRow = (record: any) => {
    const { account, goToRoute } = this.props
    if (!account) return
    goToRoute(record.permalink)
  }

  onSetAgreementOption = (agreementId: ID) => {
    this.setState({ selectedAgreement: agreementId })
  }

  onSetYearOption = (year: string) => {
    let start: Moment
    let end: Moment
    if (year === messages.thisYear) {
      const now = moment()
      start = now.clone().subtract(1, 'years')
      end = now
    } else {
      start = moment('01/01/' + year)
      end = start.clone().add(1, 'year')
    }
    this.props.fetchDashboardListenData(
      this.props.agreements.map((t) => t.agreement_id),
      start.toISOString(),
      end.toISOString()
    )
  }

  renderCreatorContent() {
    const { account, listenData, agreements, unlistedAgreements, stats, isMatrix } =
      this.props
    const agreementCount = this.props.account?.agreement_count || 0
    if (!account || !(agreementCount > 0)) return null

    const { selectedAgreement } = this.state

    const statTiles: ReactNode[] = []
    each(stats, (stat, title) =>
      statTiles.push(<StatTile key={title} title={title} value={stat} />)
    )

    const chartData =
      selectedAgreement === -1 ? listenData.all : listenData[selectedAgreement]

    const chartAgreements = agreements.map((agreement: any) => ({
      id: agreement.agreement_id,
      name: agreement.title
    }))

    const listedDataSource = this.formatMetadata(agreements)
    const unlistedDataSource = this.formatMetadata(unlistedAgreements)
    return (
      <>
        <div className={styles.sectionContainer}>
          <Suspense fallback={<div className={styles.chartFallback} />}>
            <TotalPlaysChart
              data={chartData}
              isMatrix={isMatrix}
              agreements={chartAgreements}
              selectedAgreement={selectedAgreement}
              onSetYearOption={this.onSetYearOption}
              onSetAgreementOption={this.onSetAgreementOption}
              accountCreatedAt={account.created_at}
            />
          </Suspense>
        </div>
        <div className={cn(styles.sectionContainer, styles.statsContainer)}>
          {statTiles}
        </div>
        <div className={styles.agreementsTableWrapper}>
          <AgreementsTableContainer
            onClickRow={this.onClickRow}
            listedDataSource={listedDataSource}
            unlistedDataSource={unlistedDataSource}
            account={account}
          />
        </div>
      </>
    )
  }

  renderProfileSection() {
    const { account, goToRoute } = this.props
    if (!account) return null

    return (
      <div className={styles.profileContainer}>
        <LandlordProfile
          userId={account.user_id}
          profilePictureSizes={account._profile_picture_sizes}
          isVerified={account.is_verified}
          name={account.name}
          handle={account.handle}
          onViewProfile={() => goToRoute(profilePage(account.handle))}
        />
      </div>
    )
  }

  render() {
    const { account, status } = this.props
    const header = <Header primary='Dashboard' />

    return (
      <Page
        title='Dashboard'
        description='View important stats like plays, reposts, and more.'
        contentClassName={styles.pageContainer}
        header={header}
      >
        {!account || status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <>
            {this.renderProfileSection()}
            {this.renderCreatorContent()}
          </>
        )}
      </Page>
    )
  }
}

const makeMapStateToProps = () => {
  const getDashboard = makeGetDashboard()
  return (state: AppState) => ({
    ...getDashboard(state),
    listenData: getDashboardListenData(state),
    status: getDashboardStatus(state),
    isMatrix: getTheme(state) === Theme.MATRIX
  })
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchDashboard: () => dispatch(fetchDashboard()),
  fetchDashboardListenData: (agreementIds: ID[], start: string, end: string) =>
    dispatch(fetchDashboardListenData(agreementIds, start, end, 'month')),
  resetDashboard: () => dispatch(resetDashboard()),
  goToRoute: (route: string) => dispatch(pushRoute(route))
})

const g = withClassNullGuard(mapper)

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(g(LandlordDashboardPage))
)
