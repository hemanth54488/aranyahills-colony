import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { BarChart2, Check } from 'lucide-react'

export default function Polls() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [myVotes, setMyVotes] = useState({})
  const [allVotes, setAllVotes] = useState({})
  const [voting, setVoting] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('polls').select('*').order('created_at', { ascending: false }),
      supabase.from('poll_votes').select('*').eq('voted_by', profile.id),
      supabase.from('poll_votes').select('poll_id, option_id'),
    ]).then(([{ data: p }, { data: mv }, { data: av }]) => {
      setPolls(p ?? [])
      const mvMap = {}
      ;(mv ?? []).forEach(v => { mvMap[v.poll_id] = v.option_id })
      setMyVotes(mvMap)
      const avMap = {}
      ;(av ?? []).forEach(v => {
        if (!avMap[v.poll_id]) avMap[v.poll_id] = {}
        avMap[v.poll_id][v.option_id] = (avMap[v.poll_id][v.option_id] ?? 0) + 1
      })
      setAllVotes(avMap)
      setLoading(false)
    })
  }, [])

  async function castVote(pollId, optionId) {
    if (myVotes[pollId] !== undefined) return
    setVoting(pollId)
    const { error } = await supabase.from('poll_votes').insert({ poll_id: pollId, voted_by: profile.id, option_id: optionId })
    setVoting(null)
    if (error) { notify.error('Vote failed', error.message); return }
    setMyVotes(v => ({ ...v, [pollId]: optionId }))
    setAllVotes(v => {
      const pollVotes = { ...(v[pollId] ?? {}) }
      pollVotes[optionId] = (pollVotes[optionId] ?? 0) + 1
      return { ...v, [pollId]: pollVotes }
    })
    notify.success('Vote recorded!')
  }

  const now = new Date().toISOString()
  const active = polls.filter(p => !p.ends_at || p.ends_at > now)
  const closed = polls.filter(p => p.ends_at && p.ends_at <= now)

  function PollCard({ poll }) {
    const options = poll.options ?? []
    const hasVoted = myVotes[poll.poll_id ?? poll.id] !== undefined
    const pollId = poll.id
    const voted = myVotes[pollId] !== undefined
    const isClosed = poll.ends_at && new Date(poll.ends_at) <= new Date()
    const pollVotes = allVotes[pollId] ?? {}
    const total = Object.values(pollVotes).reduce((a, b) => a + b, 0)
    const showResults = isClosed || voted || poll.show_results === 'always'

    return (
      <div className="bg-white border border-forest-100 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-forest-800 text-base">{poll.title}</h3>
            {poll.description && <p className="text-sm text-forest-500 mt-1">{poll.description}</p>}
          </div>
          {isClosed && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold shrink-0">{t('polls.closed')}</span>}
          {!isClosed && !voted && <span className="text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-semibold shrink-0">{t('polls.active')}</span>}
        </div>

        {poll.ends_at && (
          <p className="text-xs text-forest-400 mb-3">{t('polls.endsAt')}: {new Date(poll.ends_at).toLocaleDateString('en-IN')}</p>
        )}

        <div className="space-y-2">
          {options.map((opt, i) => {
            const optVotes = pollVotes[opt.id] ?? 0
            const pct = total > 0 ? Math.round((optVotes / total) * 100) : 0
            const isMyVote = myVotes[pollId] === opt.id
            return (
              <div key={opt.id}>
                {!voted && !isClosed ? (
                  <button onClick={() => castVote(pollId, opt.id)} disabled={voting === pollId}
                    className="w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all border-forest-200 text-forest-700 hover:border-forest-500 hover:bg-forest-50 active:scale-[0.98]">
                    {opt.text}
                  </button>
                ) : (
                  <div className={`relative overflow-hidden rounded-xl border-2 px-4 py-3 ${isMyVote ? 'border-forest-600 bg-forest-50' : 'border-forest-100'}`}>
                    <div className="absolute inset-y-0 left-0 bg-forest-100 rounded-xl transition-all duration-500" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-forest-700 flex items-center gap-2">
                        {isMyVote && <Check className="w-3.5 h-3.5 text-forest-600" />}
                        {opt.text}
                      </span>
                      {showResults && <span className="text-xs font-bold text-forest-600">{pct}%</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {showResults && total > 0 && (
          <p className="text-xs text-forest-400 mt-3">{total} {t('polls.votes')}</p>
        )}
        {voted && !isClosed && <p className="text-xs text-forest-500 mt-2">{t('polls.alreadyVoted')}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('polls.title')}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_,i) => <div key={i} className="h-40 bg-forest-50 rounded-2xl animate-pulse" />)}</div>
      ) : polls.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('polls.noPolls')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-forest-500 uppercase tracking-wide">{t('polls.active')}</h2>
              {active.map(p => <PollCard key={p.id} poll={p} />)}
            </>
          )}
          {closed.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-forest-500 uppercase tracking-wide mt-4">{t('polls.closed')}</h2>
              {closed.map(p => <PollCard key={p.id} poll={p} />)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
