import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [films, setFilms] = useState([]);
  const [selectedFilmId, setSelectedFilmId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [movieSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const filmsPerPage = 50;
  const indexOfLastFilm = currentPage * filmsPerPage;
  const indexOfFirstFilm = indexOfLastFilm - filmsPerPage;

  const currentFilms =
    searchTerm.length >= 3
      ? searchResults.slice(indexOfFirstFilm, indexOfLastFilm)
      : filteredFilms.slice(indexOfFirstFilm, indexOfLastFilm);

  const totalFilms =
    searchTerm.length >= 3 ? searchResults.length : filteredFilms.length;

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalFilms / filmsPerPage); i++) {
    pageNumbers.push(i);
  }

  const renderPaginationButton = (number) => (
    <li key={number}>
      <button onClick={() => setCurrentPage(number)} className="text-white">
        {number}
      </button>
    </li>
  );

  const renderEllipsis = (key) => (
    <span key={key} className="px-3 text-white">
      ...
    </span>
  );

  const renderPagination = () => {
    if (pageNumbers.length <= 5) {
      return pageNumbers.map((number) => renderPaginationButton(number));
    } else {
      let pagesToDisplay = [];

      pagesToDisplay.push(renderPaginationButton(1));

      if (currentPage > 3) {
        pagesToDisplay.push(renderEllipsis("ellipsis1"));
      }

      for (
        let i = Math.max(2, currentPage - 2);
        i <= Math.min(currentPage + 2, pageNumbers.length - 1);
        i++
      ) {
        pagesToDisplay.push(renderPaginationButton(i));
      }

      if (currentPage < pageNumbers.length - 2) {
        pagesToDisplay.push(renderEllipsis("ellipsis2"));
      }

      pagesToDisplay.push(renderPaginationButton(pageNumbers.length));

      return pagesToDisplay;
    }
  };

  useEffect(() => {
    fetch("http://localhost:3000/api/films")
      .then((res) => res.json())
      .then((data) => {
        setFilms(data);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/films/meta")
      .then((response) => {
        const { genres } = response.data;
        setGenres(genres);
      })
      .catch((error) => {
        console.error(
          "Erreur lors de la récupération des métadonnées des films :",
          error
        );
      });
  }, []);

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
  };

  useEffect(() => {
    let filteredFilms = films;

    if (selectedGenre) {
      filteredFilms = filteredFilms.filter(
        (film) => film.genre === selectedGenre
      );
    }

    setFilteredFilms(filteredFilms);
  }, [films, selectedGenre]);

  const handleImageClick = () => {
    setShowInput(true);
  };

  useEffect(() => {
    if (searchTerm.length >= 3) {
      axios
        .get(`http://localhost:3000/api/films/search?title=${searchTerm}`)
        .then((response) => {
          if (response.data.length > 0) {
            setSearchResults(response.data);
          } else {
            axios
              .get(
                `http://localhost:3000/api/films/search?realisateurs=${searchTerm}`
              )
              .then((response) => {
                setSearchResults(response.data);
              })
              .catch((error) => {
                console.error(
                  "Erreur lors de la recherche des films par réalisateur :",
                  error
                );
              });
          }
        })
        .catch((error) => {
          console.error(
            "Erreur lors de la recherche des films par titre :",
            error
          );
        });
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearchInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getMovieSessions = async (filmTitle) => {
    try {
      const response = await axios.get(
        `http://services.cineserie.com/v1/search/movies?q=${encodeURIComponent(
          filmTitle
        )}`
      );

      if (response && response.data && response.data.length > 0) {
        const filmId = response.data[0].id;
        const cineserieUrl = `https://www.cineserie.com/movies/${filmId}/`;
        console.log("L'URL de la page de Cineserie est :", cineserieUrl);
      } else {
        console.error("Aucun film trouvé avec le titre :", filmTitle);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des séances de cinéma :",
        error
      );
    }
  };

  const openFilmModal = (filmId) => {
    setSelectedFilmId(filmId);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
    const movieTitle = films.find((film) => film._id === filmId).titre;
    getMovieSessions(movieTitle);
  };

  const closeFilmModal = () => {
    setSelectedFilmId(null);
    setModalOpen(false);
    document.body.style.overflow = "";
  };

  const checkUserLoggedIn = () => {
    const userLoggedIn = localStorage.getItem("token") !== null;
    if (!userLoggedIn) {
      navigate("/login");
      return false;
    }
    return true;
  };

  function likeFilm(filmId) {
    if (!checkUserLoggedIn()) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film ajouté à vos favoris !");
        } else {
          alert("Le film est déjà dans votre liste favoris.");
        }
      });
  }

  function watchFilm(filmId) {
    if (!checkUserLoggedIn()) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/watch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film ajouté à votre liste de films déjà vu !");
        } else {
          alert(
            "Le film est déjà dans votre liste de films déjà vu ou le film est encore dans votre liste de film à voir."
          );
        }
      });
  }

  function watchlistFilm(filmId) {
    if (!checkUserLoggedIn()) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film ajouté à votre liste de films à voir !");
        } else {
          alert(
            "Le film est déjà dans votre liste de film à voir ou le film est dans votre liste de film déjà vu."
          );
        }
      });
  }

  return (
    <div className={`bg-slate-900 ${modalOpen ? "overflow-hidden" : ""}`}>
      <div className="flex items-center justify-end p-5">
        <img
          src="src/images/loginuser1.webp"
          alt="logo"
          className="p-5 w-1/7"
          onClick={() => navigate("/dashboard")}
        />
        {!showInput && (
          <img
            src="src/images/loupe1.webp"
            alt="logo"
            className="p-5 cursor-pointer w-1/7"
            onClick={handleImageClick}
          />
        )}
        {showInput && (
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Rechercher un film..."
            className="items-center justify-center w-1/5 p-3 text-black bg-white rounded h-1/6"
          />
        )}
        <select
          value={selectedGenre}
          onChange={handleGenreChange}
          className="w-1/12 text-white bg-transparent rounded h-1/6"
        >
          <option value="" className="text-black">
            Tous les genres
          </option>
          {genres.map((genre) => (
            <option key={genre} value={genre} className="w-1/5 text-black">
              {genre}
            </option>
          ))}
        </select>
      </div>
      <h1 className="mt-2 mb-16 font-extrabold text-center text-white uppercase md:text-4xl">
        La Cinémathèque Française
      </h1>
      <div className="w-full h-full bg-slate-900">
        {" "}
        {searchTerm.length >= 3 && searchResults.length === 0 && (
          <p className="text-center text-white">
            Désolé, aucun titre disponible
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center w-full gap-5 mt-5 align-center">
        {currentFilms.map((film) => (
          <div
            className="w-1/3 h-full p-1 text-center rounded md:w-1/4 lg:w-1/5 xl:w-1/6"
            key={film._id}
          >
            <div onClick={() => openFilmModal(film._id)}>
              <img
                src={
                  film.posterPath
                    ? `https://image.tmdb.org/t/p/w500${film.posterPath}`
                    : "src/images/endgame.jpg"
                }
                alt={film.titre}
              />{" "}
            </div>
            <div className="flex flex-row justify-center gap-1 mt-2">
              <img
                src="src/images/love.webp"
                alt="icone love film"
                onClick={() => likeFilm(film._id)}
                className="w-4 h-4 cursor-pointer"
              />
              <img
                src="src/images/watch.webp"
                alt="icone eye film"
                onClick={() => watchFilm(film._id)}
                className="w-4 h-4 cursor-pointer"
              />
              <img
                src="src/images/towatch.webp"
                alt="icone watchlist film"
                onClick={() => watchlistFilm(film._id)}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
      <ul className="flex justify-center gap-5 mt-5">{renderPagination()}</ul>
      {selectedFilmId && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${
            modalOpen ? "visible" : "hidden"
          }`}
          onClick={closeFilmModal}
        >
          <div
            className="w-4/5 overflow-x-hidden overflow-y-auto bg-blue-900 rounded-lg h-5/6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <div className="w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${
                    films.find((film) => film._id === selectedFilmId)
                      .trailerPath
                  }?autoplay=1&mute=1`}
                  title="Bande annonce"
                  width="100%"
                  height="175px"
                  allowFullScreen
                  autoPlay
                ></iframe>
              </div>
              <div className="flex flex-col w-full gap-2 mt-3 ml-3">
                <div className="flex flex-col items-center w-4/6 gap-2">
                  <h3 className="text-white">
                    Réalisateurs :{" "}
                    {
                      films.find((film) => film._id === selectedFilmId)
                        .realisateurs
                    }
                  </h3>
                  <p className="text-white">
                    Genre :{" "}
                    {films.find((film) => film._id === selectedFilmId).genre}
                  </p>
                </div>
                <div className="flex flex-col w-4/5 gap-2 mt-3">
                  <div className="flex flex-row gap-2">
                    <p className="text-white">
                      {films.find((film) => film._id === selectedFilmId).duree}
                    </p>
                    <p className="text-white">
                      {
                        films.find((film) => film._id === selectedFilmId)
                          .votePath
                      }
                    </p>
                    <p className="font-bold text-white uppercase">
                      {
                        films.find((film) => film._id === selectedFilmId)
                          .annee_de_production
                      }
                    </p>
                  </div>
                  <h2 className="font-extrabold text-white uppercase">
                    {films.find((film) => film._id === selectedFilmId).titre}
                  </h2>
                  <p className="w-full text-justify text-white">
                    {films.find((film) => film._id === selectedFilmId).synopsis}
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="mb-5 ml-5 font-bold text-white">
                  Séances de cinéma :
                </h3>
                <ul className="flex flex-wrap items-center justify-center gap-5 text-white">
                  {movieSessions.map((session, index) => (
                    <li key={index}>
                      {session.cinema && session.cinema.name ? (
                        <span>Cinéma : {session.cinema.name}</span>
                      ) : (
                        <span>Cinéma non disponible</span>
                      )}
                      {session.date && session.time ? (
                        <span>
                          Date : {session.date} - Heure : {session.time}
                        </span>
                      ) : (
                        <span>Date et heure non disponibles</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
