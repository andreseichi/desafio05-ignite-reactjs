import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { first_publication_date } = post;
  const first_publication_date_formated = format(
    new Date(first_publication_date),
    'dd MMM yyyy',
    { locale: ptBR }
  );

  let readTime;
  function getReadTime(): number {
    const regex = /\S+/g;
    let totalWords = 0;
    post.data.content.reduce((acc, actual) => {
      totalWords += actual.heading?.split(regex).length;

      actual.body.map(item => {
        totalWords += item.text.split(regex).length;
        return 0;
      });

      return acc;
    }, 0);

    const wordsPerMinute = 200;
    readTime = Math.ceil(totalWords / wordsPerMinute);
    return readTime;
  }
  getReadTime();

  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={commonStyles.content}>
          <header>
            <h1 className={styles.title}>{post.data.title}</h1>
            <div className={styles.footer}>
              <time className={styles.time}>
                <FiCalendar />
                <span className={styles.publicationDate}>
                  {first_publication_date_formated}
                </span>
              </time>
              <p className={styles.author}>
                <FiUser />
                <span className={styles.postAuthor}>{post.data.author}</span>
              </p>
              <p className={styles.readTime}>
                <FiClock />
                <span className={styles.readTimeAmount}>{readTime} min</span>
              </p>
            </div>
          </header>

          {post.data.content.map(content => (
            <div key={content.heading} className={styles.postContent}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
                className={styles.bodyContent}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: response.data,
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
