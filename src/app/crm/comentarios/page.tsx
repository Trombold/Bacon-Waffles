import { getReviews } from '@/lib/crm-queries';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function Comentarios() {
  const reviews = await getReviews();
  return <ReviewsClient reviews={reviews} />;
}
