import { Suspense, Component, useMemo, ReactNode } from 'react'

import { ID, Status, Theme, DigitalContent, User } from '@coliving/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { each } from 'lodash'
import moment, { Moment } from 'moment'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getTheme } from 'common/store/ui/theme/selectors'
import { formatCount } from 'common/utils/formatUtil'
import Header from 'components/header/desktop/header'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Page from 'components/page/page'
import TableOptionsButton from 'components/digitalContentsTable/tableOptionsButton'
import DigitalContentsTable, { alphaSortFn } from 'components/digitalContentsTable/digitalContentsTable'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'
import { AppState } from 'store/types'
import lazyWithPreload from 'utils/lazyWithPreload'
import { profilePage, TRENDING_PAGE } from 'utils/route'
import { withClassNullGuard } from 'utils/withNullGuard'

import styles from './LandlordDashboardPage.module.css'
import LandlordProfile from './components/landlordProfile'
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
  () => import('./components/totalPlaysChart')
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

type DataSourceDigitalContent = DigitalContent & {
  key: string
  name: string
  date: string
  time?: number
  saves: number
  reposts: number
  plays: number
}

type DigitalContentsTableProps = {
  onClickRow: (record: any) => void
  unlistedDataSource: DataSourceDigitalContent[]
  listedDataSource: DataSourceDigitalContent[]
  account: User
}

export const messages = {
  publicDigitalContentsTabTitle: 'PUBLIC AGREEMENTS',
  unlistedDigitalContentsTabTitle: 'HIDDEN AGREEMENTS',
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
      render: (val: string, record: DataSourceDigitalContent) => (
        <div className={styles.digitalContentName}>
          {val}
          {record.is_delete ? ' [Deleted By Author]' : ''}
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
            digitalContentId={val.digital_content_id}
            isFavorited={val.has_current_user_saved}
            isOwner
            isLandlordPick={account._landlord_pick === val.digital_content_id}
            isUnlisted={record.is_unlisted}
            index={index}
            digitalContentTitle={val.name}
            digitalContentPermalink={val.permalink}
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

const DigitalContentsTableContainer = ({
  onClickRow,
  listedDataSource,
  unlistedDataSource,
  account
}: DigitalContentsTableProps) => {
  const tabRecalculator = useTabRecalculator()

  const tabHeaders = useMemo(
    () => [
      {
        text: messages.publicDigitalContentsTabTitle,
        label: messages.publicDigitalContentsTabTitle
      },
      {
        text: messages.unlistedDigitalContentsTabTitle,
        label: messages.unlistedDigitalContentsTabTitle
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
        <DigitalContentsTable
          dataSource={listedDataSource}
          limit={5}
          columns={makeColumns(account, false)}
          onClickRow={onClickRow}
          didToggleShowDigitalContents={() => {
            tabRecalculator.recalculate()
          }}
          animateTransitions={false}
        />
      </div>,
      <div
        key='unlisted'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        <DigitalContentsTable
          dataSource={unlistedDataSource}
          limit={5}
          columns={makeColumns(account, true)}
          onClickRow={onClickRow}
          didToggleShowDigitalContents={() => tabRecalculator.recalculate()}
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
    selectedDigitalContent: -1 // all digitalContents
  }

  componentDidMount() {
    this.props.fetchDashboard()
    TotalPlaysChart.preload()
  }

  componentDidUpdate() {
    const digitalContentCount = this.props.account?.digital_content_count || 0
    if (!(digitalContentCount > 0)) {
      this.props.goToRoute(TRENDING_PAGE)
    }
  }

  componentWillUnmount() {
    this.props.resetDashboard()
  }

  formatMetadata(digitalContentMetadatas: DigitalContent[]): DataSourceDigitalContent[] {
    return digitalContentMetadatas
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

  onSetDigitalContentOption = (digitalContentId: ID) => {
    this.setState({ selectedDigitalContent: digitalContentId })
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
      this.props.digitalContents.map((t: { digital_content_id: any }) => t.digital_content_id),
      start.toISOString(),
      end.toISOString()
    )
  }

  renderCreatorContent() {
    const { account, listenData, digitalContents, unlistedDigitalContents, stats, isMatrix } =
      this.props
    const digitalContentCount = this.props.account?.digital_content_count || 0
    if (!account || !(digitalContentCount > 0)) return null

    const { selectedDigitalContent } = this.state

    const statTiles: ReactNode[] = []
    each(stats, (stat, title) =>
      statTiles.push(<StatTile key={title} title={title} value={stat} />)
    )

    const chartData =
      selectedDigitalContent === -1 ? listenData.all : listenData[selectedDigitalContent]

    const chartDigitalContents = digitalContents.map((digital_content: any) => ({
      id: digital_content.digital_content_id,
      name: digital_content.title
    }))

    const listedDataSource = this.formatMetadata(digitalContents)
    const unlistedDataSource = this.formatMetadata(unlistedDigitalContents)
    return (
      <>
        <div className={styles.sectionContainer}>
          <Suspense fallback={<div className={styles.chartFallback} />}>
            <TotalPlaysChart
              data={chartData}
              isMatrix={isMatrix}
              digitalContents={chartDigitalContents}
              selectedDigitalContent={selectedDigitalContent}
              onSetYearOption={this.onSetYearOption}
              onSetDigitalContentOption={this.onSetDigitalContentOption}
              accountCreatedAt={account.created_at}
            />
          </Suspense>
        </div>
        <div className={cn(styles.sectionContainer, styles.statsContainer)}>
          {statTiles}
        </div>
        <div className={styles.digitalContentsTableWrapper}>
          <DigitalContentsTableContainer
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
  fetchDashboardListenData: (digitalContentIds: ID[], start: string, end: string) =>
    dispatch(fetchDashboardListenData(digitalContentIds, start, end, 'month')),
  resetDashboard: () => dispatch(resetDashboard()),
  goToRoute: (route: string) => dispatch(pushRoute(route))
})

const g = withClassNullGuard(mapper)

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(g(LandlordDashboardPage))
)
